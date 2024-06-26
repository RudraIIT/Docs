const mongoose = require("mongoose")
const Document = require("./model.js")

mongoose.connect("mongodb://localhost:27017/google-docs-clone").then(() => {
    console.log("Connected to MongoDB")
})

const io = require("socket.io")(8080, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: "" })
}