import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

// postgresql database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "",
  password: "123456",
  port: 5432,
});
db.connect();

// middleware and public route
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let x = [];

// axios request for id
const query = "Book Name";
async function searchBookandCoverId(query) {
  const url = `https://openlibrary.org/search.json?q=${query}`;

  try {
    const response = await axios.get(url);
    const books = response.data.docs;

    if (books.length > 0) {
      // to get the first data
      const coverID = books[0].cover_i;
      const coverTitle = books[0].title;
      return { coverID, coverTitle };
    } else {
      return null; // no books found
    }
  } catch (error) {
    console.error("Error searching for the book:", error);
    return null; // error occured
  }
}

// axios request for image
function getCoverImageUrl(coverID) {
  if (coverID) {
    return `https://covers.openlibrary.org/b/id/${coverID}-L.jpg`;
  } else {
    return null;
  }
}

searchBookandCoverId(query).then((coverID) => {
  if (coverID) {
    const coverImageURL = getCoverImageUrl(coverID);
    console.log("Cover image URL:", coverImageURL);
  } else {
    console.log("Could not find a cover ID.");
  }
});

// get: display title and image to user
app.get("/", async (req, res) => {
  const query = "Book Name";
  const coverInfo = await searchBookandCoverId(query);

  if (coverInfo) {
    const coverImageUrl = getCoverImageUrl(coverInfo.coverID);
    res.render("index.ejs", {
      coverID: coverInfo.coverID,
      coverTitle: coverInfo.coverTitle,
      coverImageUrl: coverImageUrl,
    });
  } else {
    res.send("No books found or error occured.");
  }
});

app.post("/", async (req, res) => {});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
