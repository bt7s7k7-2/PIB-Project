import { Logger, TerminalLogger } from "@apsides/foundation"
import { RestTransportClient } from "@apsides/rest-integration"
import { RpcClient } from "@apsides/rpc"
import { AsyncInitializationQueue, ServiceLoader } from "@apsides/services"
import { Status } from "schema"
import { StatusProxy } from "./api-client/StatusProxy"

const services = new ServiceLoader()
    .add(TerminalLogger)
    .add(RestTransportClient.make({
        controllers: [StatusProxy],
        host: "http://localhost:8080",
        root: "/"
    }))
    .add(RpcClient)
    .load()

await services.get(AsyncInitializationQueue.kind).awaitAll()

const logger = services.get(Logger.kind)
logger.info`Ready.`

const client = services.get(RpcClient.kind)
const status = await client.getProxy(StatusProxy)
logger.info`${Status.ref().clone(status)}`
