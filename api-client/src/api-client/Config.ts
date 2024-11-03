import { Struct, Type } from "@apsides/struct"

export class Config extends Struct.define("Config", {
    caUrl: Type.string,
    domain: Type.string,
    keyDir: Type.string,
    webRoot: Type.string
}) { }
