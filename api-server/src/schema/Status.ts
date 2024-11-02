import { Api } from "@apsides/rpc"
import { Struct, Type } from "@apsides/struct"

export class Status extends Struct.define("Status", {
    ready: Type.boolean,
}) { }

export const StatusApi = Api.define(Status, {})
