import { ClientError, Logger, TerminalLogger } from "@apsides/foundation"
import { RestTransportClient } from "@apsides/rest-integration"
import { RpcClient } from "@apsides/rpc"
import { AsyncInitializationQueue, ServiceLoader } from "@apsides/services"
import { execSync } from "child_process"
import { existsSync } from "fs"
import { mkdir, readFile, rm, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { CertificateRequest, Status } from "schema"
import { Config } from "./api-client/Config"
import generateCsr from "./api-client/generate-csr.conf"
import { CertificateAuthorityProxy, IssueOperationProxy, StatusProxy } from "./api-client/proxies"

const logger = new TerminalLogger()
logger.info`Loading config file...`

const config = Config.deserialize(JSON.parse(await readFile("./cert-client.json", { encoding: "utf-8" })))

const services = new ServiceLoader()
    .provide(Logger.kind, logger)
    .add(RestTransportClient.make({
        controllers: [StatusProxy, CertificateAuthorityProxy, IssueOperationProxy],
        host: config.caUrl,
        root: "/"
    }))
    .add(RpcClient)
    .load()

await services.get(AsyncInitializationQueue.kind).awaitAll()

logger.info`Testing connection to CA...`

const client = services.get(RpcClient.kind)
const status = await client.getProxy(StatusProxy)
logger.info`${Status.ref().clone(status)}`

const privateKey = join(config.keyDir, "private.key")

if (!existsSync(privateKey)) {
    logger.info`Generating private key...`
    execSync(`openssl genrsa -out ${privateKey} 2048`)
} else {
    logger.info`Private key already exists`
}

try {
    try {
        logger.info`Generating CSR...`
        await writeFile("generate-csr.conf", generateCsr.replace(/__domain__/g, config.domain))

        execSync(`openssl req -new -config generate-csr.conf -key ${privateKey} -out client.csr`)

        const csr = await readFile("client.csr")

        logger.info`Sending CSR...`
        const issueOperation = await client.getEmptyProxy(CertificateAuthorityProxy).requestCertificate(new CertificateRequest({ csr: csr.toString("base64") }))

        logger.info`  ${issueOperation}`

        logger.info`Preparing for challenge...`
        const challengeFile = join(config.webRoot, issueOperation.challengePath)
        const challengeDir = dirname(challengeFile)
        await mkdir(challengeDir, { recursive: true })
        try {
            await writeFile(challengeFile, issueOperation.challenge)

            logger.info`Waiting for CA to verify...`
            const result = await client.getEmptyProxy(IssueOperationProxy, issueOperation.id).verify()

            logger.info`Saving certificate...`
            const certificate = Buffer.from(result.certificate, "base64")
            await writeFile("server.cert", certificate)
        } finally {
            logger.info`Cleaning up challenge...`
            await rm(challengeDir, { force: true, recursive: true })
        }

    } finally {
        logger.info`Cleaning temporary files...`
        await rm("generate-csr.conf", { force: true })
        await rm("client.csr", { force: true })
    }

    logger.info`Done!`
} catch (err) {
    if (err instanceof ClientError) {
        logger.error`${err.code} ${err.message}`
    } else throw err
}
