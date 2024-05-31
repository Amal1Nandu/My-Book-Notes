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
  database: "mybook",
  password: "123456",
  port: 5433,
});
db.connect();

// middleware and public route
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let mybooknotes = [
  {
    cover_i: 1,
    cover_title: "",
    cover_img: "",
    authur_name: "",
    book_preview: "",
    book_note: "",
    read_date: 123,
    read_rating: 10,
  },
]; // need to check

// axios function to search book and coverID
async function searchBookandCoverId(query) {
  const url = `https://openlibrary.org/search.json?title=${query}&limit=10`;

  try {
    const response = await axios.get(url);
    const books = response.data.docs;

    if (books.length > 0) {
      // to get the first data
      const coverID = books[0].cover_i;
      const coverTitle = books[0].title;
      const authorName = books[0].author_name;
      return { coverID, coverTitle, authorName };
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
    return `https://covers.openlibrary.org/b/id/${coverID}-M.jpg`;
  } else {
    return null;
  }
}

// database for retrieving
async function bookData(query) {
  const coverData = await searchBookandCoverId(query);

  if (coverData) {
    const result = await db.query("SELECT * FROM mybooknotes");
    return result.rows;
  } else {
    return null;
  }
}

// get: display title and image to user
app.get("/", async (req, res) => {
  const query = req.query.search_text;
  const coverInfo = await searchBookandCoverId(query);

  if (coverInfo) {
    const coverImageUrl = getCoverImageUrl(coverInfo.coverID);
    res.render("index.ejs", {
   //   coverID: coverInfo.coverID,
      coverTitle: coverInfo.coverTitle,
      authorName: coverInfo.authorName,
      coverImageUrl: coverImageUrl,
    });
  } else {
    res.send("No books found or error occured.");
  }
});

// page for preview and notes will open along with all other data recieved
app.post("/check", async (req, res) => {
  const query = req.body.search_text;

  const coverInfo = await searchBookandCoverId(query);

  if (coverInfo) {
    const coverImageUrl = getCoverImageUrl(coverInfo.coverID);
    res.render("note.ejs", {
    //  coverID: coverInfo.coverID,
      coverTitle: coverInfo.coverTitle,
      authorName: coverInfo.authorName,
      coverImageUrl: coverImageUrl,
    });
  } else {
    res.send("No book found or error occured.");
  }
});

// saving data on database
app.post("/submit", async (req, res) => {

  // retrieved from the note.ejs file
  const {coverTitle, authorName, coverImageUrl } = req.body;

  const preview = req.body.previewTextarea;
  const notes = req.body.noteTextarea;
  const rating = req.body.rating;

  try {
    await db.query(
      "INSERT INTO mybooknotes (cover_title, cover_img, authur_name, book_preview, book_note, read_rating) VALUES ($1, $2, $3, $4, $5, $6)",
      [coverTitle, coverImageUrl, authorName, preview, notes, rating]
    );
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.send("Error saving data.");
  }
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});

/* 

get homepage copy
  if (coverInfo) {
    const coverImageUrl = getCoverImageUrl(coverInfo.coverID);
    res.render("index.ejs", {
      coverID: coverInfo.coverID,
      coverTitle: coverInfo.coverTitle,
      authorName: coverInfo.authorName,
      coverImageUrl: coverImageUrl
    });
  } else {
    res.send("No books found or error occured.");
  }
  */

/* 
  post reuest copy
    if (coverInfo) {
  
    res.redirect(`/?search_text=${query}`);
  } else {
    res.send("No book found or error occured.")
  }
   
  */
