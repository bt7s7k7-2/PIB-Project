import { Api } from "@apsides/rpc"
import { Struct, Type } from "@apsides/struct"
import { CertificateRequest, CertificateResult } from "./CertificateRequest"

export class IssueOperation extends Struct.define("IssueOperation", {
    id: Type.string,
    challenge: Type.string,
    challengePath: Type.string
}) { }

export const IssueOperationApi = Api.define(IssueOperation, {
    verify: Api.action(Type.empty, CertificateResult.ref()),
    cancel: Api.action(Type.empty, Type.empty)
})
