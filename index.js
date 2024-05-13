// Create a server using HTTP module

const { error } = require('console')
const http = require('http')
const { parse } = require('path')
const { send } = require('process')
const { stringify } = require('querystring')
const { json } = require('stream/consumers')

const url = require('url')
const fs = require('fs')

const PORT = 3000
const CONTENT_TYPE_JSON = {
    "Content-Type": "application/json" 
}

const CONTENT_TYPE_HTML = {
    "Content-Type": "text/html"
}

const contactBook = [
    {
        id:0,
        name: "test name",
        number: "03333333333"
    }
]

const server = http.createServer((req,res) => {
    const parsedUrl = url.parse(req.url, true)

    if(req.method === 'GET'){
        handleGetRequest(req,res,parsedUrl)
    } else if(req.method === 'POST' && parsedUrl.path === '/number'){
        handlePostRequest(req,res)
    } else if(req.method === 'PUT' && parsedUrl.path.startsWith('/number/')){
        handlePutRequest(req,res, parsedUrl)
    } else if(req.method === 'DELETE' && parsedUrl.path.startsWith('/number/')){
        handleDeleteRequest(req,res, parsedUrl)
    } else{
        sendResponse(res, 404, CONTENT_TYPE_JSON, {error: 'method not allowed'})
    }
})

server.listen(PORT, () =>{
    console.log(`Listening at PORT: ${PORT}`)
})

const sendResponse = (res, statusCode, contentType, data) => {
    res.writeHead(statusCode, contentType)
    res.end(JSON.stringify(data))
}

const handleGetRequest = (req, res, parsedUrl) => {
    if(parsedUrl.path === '/'){
        sendResponse(res, 200, CONTENT_TYPE_HTML, `<b> Numbers <a href='/number'>link</a> Page</b>`)
    } else if(parsedUrl.path === '/number'){
        sendResponse(res,200, CONTENT_TYPE_JSON, contactBook)
    } else if(parsedUrl.path.startsWith("/number")){
        const numberId = parsedUrl.query.id || parseInt(parsedUrl.path.split('/').pop());
        const number = getNumberById(numberId)
        if(number){
            sendResponse(res, 200, CONTENT_TYPE_JSON, number)
        } else{
            sendResponse(res, 404, CONTENT_TYPE_JSON, {error: "Number not found"})
        }
    } else {
        sendResponse(res, 404, CONTENT_TYPE_JSON, {error: "Endpoint not found"})
    }
    const getNumberById = (numberId) => {
        return contactBook.find(n => n.id === parseInt(numberId))
    }
}

const handlePostRequest = (req, res) => {
    let requestBody = ''
    req.on('data', (chunk) => {
        requestBody += chunk
    })
    req.on('end', () => {
        const number = JSON.parse(requestBody)
        number.id = contactBook.length + 1
        contactBook.push(number)
        sendResponse(res, 201, CONTENT_TYPE_JSON, number);
    })

}

const handlePutRequest = (req, res, parsedUrl) => {
    let requestBody = ''

    req.on('data', (chunk) => {
        requestBody += chunk
    })

    req.on('end', () => {
        const updatedNumber = JSON.parse(requestBody)
        const numberId = parseInt(parsedUrl.path.split('/').pop())
        const numberIndex = contactBook.findIndex(n => n.id === numberId)

        if(numberIndex !== -1){
            contactBook[numberIndex] = { ...contactBook[numberIndex], ...updatedNumber, id: numberId };
        sendResponse(res, 200, CONTENT_TYPE_JSON, contactBook[numberIndex])
        } else{
            sendResponse(res, 404, CONTENT_TYPE_JSON, {error: "Number not found"})
        }
    })
}

const handleDeleteRequest = (req, res, parsedUrl) => {
    const numberId = parseInt(parsedUrl.path.split('/').pop())
    const numberIndex = contactBook.findIndex(n => n.id === numberId)

    if(numberIndex !== -1){
        const deletedNumber = contactBook.splice(numberIndex, 1)[0];
    sendResponse(res, 200, CONTENT_TYPE_JSON, deletedNumber);
    } else{
        sendResponse(res, 404, CONTENT_TYPE_JSON, { error: 'Number not found' });
    }
}

const jsonContent = JSON.stringify(contactBook, null, 4);
fs.writeFileSync('contactBook.json', jsonContent, 'utf8');
