const fs = require('fs')
const path = require('path')

const serversDir = path.join(__dirname, '../servers')
const cdnDir = path.join(__dirname, '../cdn')

// Function to read directories recursively
function readDirectoriesRecursively(dir) {
    let files = []

    const items = fs.readdirSync(dir)

    items.forEach((item) => {
        const fullPath = path.join(dir, item)

        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(readDirectoriesRecursively(fullPath))
        } else {
            files.push(fullPath)
        }
    })

    return files
}

// Function to combine metadata files into a single servers.json file
function combineMetadataToServersJSON() {
    const metadataFiles = readDirectoriesRecursively(serversDir).filter(
        (file) => path.basename(file) === 'metadata.json'
    )

    const serversData = metadataFiles.map((file) => {
        return JSON.parse(fs.readFileSync(file, 'utf-8'))
    })

    const combinedData = serversData.reduce((acc, curr) => {
        return acc.concat(curr)
    }, [])

    fs.writeFileSync(
        path.join(cdnDir, 'servers.json'),
        JSON.stringify(combinedData, null, 2)
    )
}

// Function to copy and rename files to the CDN folders
function copyAndRenameFiles(folderName, fileExtension) {
    const files = readDirectoriesRecursively(serversDir).filter(
        (file) => path.basename(file) === fileExtension
    )

    files.forEach((file) => {
        const folderId = path.basename(path.dirname(file))
        const destination = path.join(cdnDir, folderName, `${folderId}.png`)

        // Create destination folder if it doesn't exist
        const destFolder = path.dirname(destination)
        if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder, { recursive: true })
        }

        fs.copyFileSync(file, destination)
    })
}

// Main function to execute all tasks
function prepareCDNUpload() {
    if (!fs.existsSync(cdnDir)) {
        fs.mkdirSync(cdnDir)
    }

    combineMetadataToServersJSON()
    copyAndRenameFiles('logos', 'logo.png')
    copyAndRenameFiles('banners', 'background.png')
}

// Usage
prepareCDNUpload()
