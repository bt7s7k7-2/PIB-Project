/// <reference path="../node_modules/@apsides/project-builder/esbuild.d.ts" />

import { Logger, TerminalLogger } from "@apsides/foundation"
import { HonoServer } from "@apsides/hono-integration"
import { RestTransportServer } from "@apsides/rest-integration"
import { RpcServer } from "@apsides/rpc"
import { AsyncInitializationQueue, ServiceLoader } from "@apsides/services"
import documentationPage from "../node_modules/@apsides/rest-integration/page.html"
import { StatusController } from "./api-server/StatusController"
import { Status } from "./schema/Status"

const services = new ServiceLoader()
    .add(TerminalLogger)
    .add(HonoServer.make({
        serve: {
            port: 8080
        }
    }))
    .add(RestTransportServer.make({
        root: "/",
        controllers: [StatusController],
        documentationPage
    }))
    .add(RpcServer)
    .load()

await services.get(AsyncInitializationQueue.kind).awaitAll()

const server = services.get(RpcServer.kind)
server.registerController(
    await server.makeController(StatusController, Status.default())
)

const logger = services.get(Logger.kind)
logger.info`Ready.`
