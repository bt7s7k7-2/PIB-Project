import { makeDataURL, makeRandomID } from "kompa"
import { CertificateAuthorityApi } from "../schema/CertificateAuthority"
import { IssueOperationController } from "./IssueOperationController"
import { IssueOperation } from "../schema/IssueOperation"
import { CryptoOperator } from "./operator/CryptoOperator"
import { ENV } from "./ENV"

export class CertificateAuthorityController extends CertificateAuthorityApi.makeController() {
    static {
        CertificateAuthorityApi.makeControllerImpl(this, {
            async requestCertificate(request) {
                const issueId = makeRandomID()

                const issue = await this.rpcServer.makeController(IssueOperationController, new IssueOperation({
                    id: issueId,
                    challenge: makeRandomID() + makeRandomID(),
                    challengePath: ENV.CHALLENGE_PATH
                }))

                issue.csr = request.csr

                this.rpcServer.registerController(issue)

                return issue
            }
        })
    }
}
