import { ClientError } from "@apsides/foundation"
import { asError } from "kompa"
import { CertificateResult } from "../schema/CertificateRequest"
import { ERR_CA_CANNOT_VERIFY } from "../schema/errors"
import { IssueOperationApi } from "../schema/IssueOperation"
import { CryptoOperator, InvalidCsrError } from "./operator/CryptoOperator"

export class IssueOperationController extends IssueOperationApi.makeController() {
    protected _crypto: CryptoOperator = null!

    public csr: string = null!

    static {
        IssueOperationApi.makeControllerImpl(this, {
            async _init() {
                this._crypto = this.rpcServer.services.get(CryptoOperator.kind)
            },
            async cancel() {
                this[Symbol.dispose]()
            },
            async verify(request) {
                this[Symbol.dispose]()

                using operation = await this._crypto.createHandle()

                let domain: string
                try {
                    domain = await operation.readCsrDomain(this.csr)
                } catch (err) {
                    if (err instanceof InvalidCsrError) {
                        throw new ClientError("Invalid CSR, " + err.message, { code: ERR_CA_CANNOT_VERIFY })
                    } else throw err
                }

                const baseUrl = "http://" + domain

                const response = await fetch(new URL(this.challengePath, baseUrl)).catch(asError)
                if (response instanceof Error) {
                    throw new ClientError("Cannot verify identity because the CA cannot connect to the client domain", { code: ERR_CA_CANNOT_VERIFY })
                }

                if (response.status != 200) {
                    throw new ClientError("Cannot verify identity, client responded with status " + response.status, { code: ERR_CA_CANNOT_VERIFY })
                }

                const responseText = await response.text()
                if (responseText != this.challenge) {
                    throw new ClientError("Cannot verify identity, client did not respond with challenge code, got: " + JSON.stringify(responseText), { code: ERR_CA_CANNOT_VERIFY })
                }

                const certificate = await operation.fulfilCsr(this.csr, domain)
                return new CertificateResult({ certificate })
            }
        })
    }
}
