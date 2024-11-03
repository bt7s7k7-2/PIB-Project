import { CertificateAuthorityApi, IssueOperationApi, StatusApi } from "schema"

export class StatusProxy extends StatusApi.makeProxy() { }

export class CertificateAuthorityProxy extends CertificateAuthorityApi.makeProxy() { }

export class IssueOperationProxy extends IssueOperationApi.makeProxy() { }
