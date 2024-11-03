import { Struct, Type } from "@apsides/struct"

export class CertificateRequest extends Struct.define("CertificateRequest", {
    csr: Type.string,
}) { }

export class CertificateResult extends Struct.define("CertificateResult", {
    certificate: Type.string
}) { }
