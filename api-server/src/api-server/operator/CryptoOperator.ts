import { DisposableHandleCollection, EventListener } from "@apsides/events"
import { AsyncInitializationQueue, ServiceFactory, ServiceKind, ServiceProvider } from "@apsides/services"
import { exec } from "child_process"
import _debug from "debug"
import { existsSync, rmSync } from "fs"
import { mkdir, readFile, writeFile } from "fs/promises"
import { makeRandomID } from "kompa"
import { join } from "path"
import { ENV } from "../ENV"
import fulfilCsrText from "./fulfil-csr.conf"
import generateCaText from "./generate-ca.conf"

const debug = _debug("api:crypto")

const _CONFIG_GENERATE_CA = "generate-ca.conf"
const _CONFIG_FULFIL_CA = "generate-cert.conf"

export class InvalidCsrError extends Error { override name = "InvalidCsrError" }

export class CryptoHandle extends EventListener {
    public override[Symbol.dispose]() {
        debug("Deleting handle %o", this.path)
        rmSync(this.path, { recursive: true })
    }

    public async createCA() {
        await writeFile(this._getPath(_CONFIG_GENERATE_CA), generateCaText.replace(/__name__/, ENV.CA_NAME))
        await this._runOpenSsl("genrsa -out ../ca-key.key 2048")
        await this._runOpenSsl(`req -new -x509 -config ${_CONFIG_GENERATE_CA} -key ../ca-key.key -out ../ca-cert.crt -days 365`)
    }

    public async readCsrDomain(csr: string) {
        await writeFile(this._getPath("request.csr"), Buffer.from(csr, "base64"))

        const parsedCsr = await this._runOpenSsl("req -noout -text -in request.csr")
        const domain = parsedCsr.match(/X509v3 Subject Alternative Name:\s+?DNS:([^\n]+)/)
        if (!domain) {
            throw new InvalidCsrError("Cannot find X509v3 Subject Alternative Name")
        }

        return domain[1]
    }

    public async fulfilCsr(csr: string, domain: string) {
        await writeFile(this._getPath("request.csr"), Buffer.from(csr, "base64"))
        await mkdir(this._getPath("certs"))
        await writeFile(this._getPath("issued-database.txt"), "")
        await writeFile(this._getPath("issued-counter.txt"), "01")
        await writeFile(this._getPath(_CONFIG_FULFIL_CA), fulfilCsrText.replace(/__domain__/, domain))

        await this._runOpenSsl(`ca -config ${_CONFIG_FULFIL_CA} -in request.csr -out domain.crt -keyfile ../ca-key.key -cert ../ca-cert.crt -batch`)

        const certificate = await readFile(this._getPath("domain.crt"))
        return certificate.toString("base64")
    }

    protected _getPath(file: string) {
        return join(this.path, file)
    }

    protected _runOpenSsl(command: string) {
        return new Promise<string>((resolve, reject) => {
            exec("openssl " + command, { cwd: this.path }, (error, stdout, stderr) => {
                debug("Executed command %o, result: %o, %o", command, stdout, stderr)

                if (error) {
                    reject(error)
                    return
                }

                resolve(stdout)
            })
        })
    }

    constructor(
        public readonly path: string
    ) { super() }
}

export class CryptoOperator {
    protected _handles = new DisposableHandleCollection<CryptoHandle>()

    public async createHandle() {
        const dir = join(process.cwd(), "operation.local")
        const path = join(dir, makeRandomID() + makeRandomID())
        debug("Creating handle %o", path)
        await mkdir(path, { recursive: true })
        const handle = new CryptoHandle(path)
        this._handles.addHandle(handle)
        return handle
    }

    public static readonly kind = new ServiceKind<CryptoOperator>("CryptoOperator")
    public static init(services: ServiceProvider) {
        const operator = new CryptoOperator()

        if (!existsSync(join(process.cwd(), "operation.local/ca-cert.crt"))) {
            services.get(AsyncInitializationQueue.kind).addTask((async () => {
                using handle = await operator.createHandle()
                await handle.createCA()
            })())
        }

        return operator
    }

    constructor() {
        process.on("exit", () => {
            for (const handle of this._handles.handles.values()) {
                handle[Symbol.dispose]()
            }
        })
    }
}

CryptoOperator satisfies ServiceFactory<CryptoOperator>
