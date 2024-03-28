const Ajv = require('ajv')
const fs = require('fs')
const path = require('path')

const schema = require('../schema.json')

const ajv = new Ajv()
const validate = ajv.compile(schema)

const baseDir = './servers'

function validateMetadataFile(filePath) {
    try {
        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const valid = validate(metadata)
        if (!valid) {
            console.error(`Validation failed for file: ${filePath}`)
            console.error(validate.errors)
            process.exitCode = 1
        } else {
            const missingProperties = schema.required.filter(
                (prop) => !(prop in metadata)
            )
            if (missingProperties.length > 0) {
                console.error(
                    `Missing required properties in file: ${filePath}`
                )
                console.error(
                    `Missing properties: ${missingProperties.join(', ')}`
                )
                process.exitCode = 1
            }

            // Check for unwanted properties
            const unwantedProperties = Object.keys(metadata).filter(
                (prop) => !schema.properties.hasOwnProperty(prop)
            )
            if (unwantedProperties.length > 0) {
                console.error(`Unwanted properties found in file: ${filePath}`)
                console.error(
                    `Unwanted properties: ${unwantedProperties.join(', ')}`
                )
                process.exitCode = 1
            }
        }
    } catch (error) {
        console.error(`Error while reading or parsing file: ${filePath}`)
        console.error(error)
        process.exitCode = 1
    }
}

function traverseDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`Directory does not exist: ${dir}`)
        return
    }

    const files = fs.readdirSync(dir)
    const expectedFiles = ['metadata.json', 'logo.png', 'background.png']

    files.forEach((file) => {
        const filePath = path.join(dir, file)
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
            traverseDirectory(filePath)
        } else if (file === 'metadata.json') {
            validateMetadataFile(filePath)
            const directoryFiles = fs.readdirSync(dir)
            const unexpectedFiles = directoryFiles.filter(
                (item) => !expectedFiles.includes(item)
            )
            if (unexpectedFiles.length > 0) {
                console.error(
                    `Unexpected file(s) found in directory: ${dir}: ${unexpectedFiles.join(
                        ', '
                    )}`
                )
                process.exitCode = 1
            }
        }
    })
}

traverseDirectory(baseDir)
