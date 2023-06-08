//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect("mongodb://127.0.0.1:27017/todolistdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to Database");
  })
  .catch((error) => {
    console.log("Error connecting to Database:", error);
  });

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = new mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Bem vindo ao bloco de tarefas!",
});

const item2 = new Item({
  name: "Aperte a tecla + para adicionar um novo item.",
});

const item3 = new Item({
  name: "<-- Aperte a caixa para deletar um item.",
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully saved default items to todolistdb");
            res.render("list", {
              listTitle: "Hoje",
              newListItems: defaultItems,
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.render("list", { listTitle: "Hoje", newListItems: foundItems });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  let customListName = req.params.customListName;
  customListName =
    customListName.charAt(0).toUpperCase() + customListName.slice(1);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list
          .save()
          .then(() => {
            res.render("list", {
              listTitle: list.name,
              newListItems: list.items,
              listName: list.name,
            });
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
          listName: foundList.name,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Hoje") {
    item
      .save()
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Hoje") {
    Item.findByIdAndRemove(checkItemId)
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } }
    )
      .then((foundList) => {
        if (foundList) {
          res.redirect("/" + listName);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
