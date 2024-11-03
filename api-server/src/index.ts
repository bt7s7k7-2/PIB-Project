/// <reference path="../node_modules/@apsides/project-builder/esbuild.d.ts" />

import { Logger, TerminalLogger } from "@apsides/foundation"
import { HonoServer } from "@apsides/hono-integration"
import { RestTransportServer } from "@apsides/rest-integration"
import { RpcServer } from "@apsides/rpc"
import { AsyncInitializationQueue, ServiceLoader } from "@apsides/services"
import documentationPage from "../node_modules/@apsides/rest-integration/page.html"
import { CertificateAuthorityController } from "./api-server/CertificateAuthorityController"
import { ENV } from "./api-server/ENV"
import { IssueOperationController } from "./api-server/IssueOperationController"
import { CryptoOperator } from "./api-server/operator/CryptoOperator"
import { StatusController } from "./api-server/StatusController"
import { CertificateAuthority } from "./schema/CertificateAuthority"
import { Status } from "./schema/Status"

const services = new ServiceLoader()
    .add(TerminalLogger)
    .add(HonoServer.make({
        serve: {
            port: +ENV.PORT
        }
    }))
    .add(RestTransportServer.make({
        root: "/",
        controllers: [StatusController, CertificateAuthorityController, IssueOperationController],
        documentationPage
    }))
    .add(RpcServer)
    .add(CryptoOperator)
    .load()

await services.get(AsyncInitializationQueue.kind).awaitAll()

const server = services.get(RpcServer.kind)
server.registerController(
    await server.makeController(StatusController, Status.default())
)

server.registerController(
    await server.makeController(CertificateAuthorityController, CertificateAuthority.default())
)

const logger = services.get(Logger.kind)
logger.info`Ready.`
