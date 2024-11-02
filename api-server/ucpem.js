/// <reference path="./.vscode/config.d.ts" />

const { PackageBuilder } = require("@apsides/project-builder")
const { rm } = require("fs/promises")
const { project, constants, getProjectDetails, run, join } = require("ucpem")

project.prefix("src").res("api-server")
project.prefix("src").res("schema")

project.script("dist", async () => {
    const builder = new PackageBuilder(constants.projectPath, getProjectDetails(), "https://github.com/bt7s7k7-2/PIB-Project")
        .addPackage("schema", "schema", { strategy: "esbuild" })

    builder.shouldCreateMasterIndex = false
    await builder.buildIndex()
    await run("yarn tsc")
    try {
        await builder.buildPackage("schema")
    } finally {
        await rm(join(constants.projectPath, "src/index_schema.ts"))
    }
})
