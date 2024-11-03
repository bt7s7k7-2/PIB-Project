import { Api } from "@apsides/rpc"
import { Struct } from "@apsides/struct"
import { CertificateRequest } from "./CertificateRequest"
import { IssueOperation } from "./IssueOperation"

export class CertificateAuthority extends Struct.define("CertificateAuthority", {}) { }

export const CertificateAuthorityApi = Api.define(CertificateAuthority, {
    requestCertificate: Api.action(CertificateRequest.ref(), IssueOperation.ref())
})
