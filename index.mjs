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
async function bookData() {
  const result = await db.query("SELECT * FROM mybooknotes ORDER BY id DESC");
  return result.rows;
}

// get: display title and image to user
app.get("/", async (req, res) => {
  try {
    const books = await bookData();
    if (books.length > 0) {
      res.render("index.ejs", {
books: books
      });
    } else {
      res.send("No books found or error occured.");
    }
  } catch (error) {
    console.error(error);
    res.send("An error occured while retrieving the books.");
  }
});

// get: Dynamic route to handle individual book page
app.get("/book/:id", async (req, res) => {
  const bookId = req.params.id;
  try {
    const result = await db.query("SELECT * FROM mybooknotes WHERE id = $1", [bookId] );
    if (result.rows.length > 0) {
      const book = result.rows[0];
      res.render("note.ejs", {
        coverID: book.cover_i,
        coverTitle: book.cover_title,
        authorName: book.authur_name,
        coverImageURL: book.cover_img,
        bookPreview: book.book_preview,
        bookNote: book.book_note,
        bookDate: book.read_date,
        readRating: book.read_rating
      });
    } else {
      res.send("book not found.");
    }
  } catch (error) {
    console.error(error);
    res.send("An error occured while retrieving the book.");
  }
});

// page for preview and notes will open along with all other data recieved
app.post("/check", async (req, res) => {
  const query = req.body.search_text;
  const coverInfo = await searchBookandCoverId(query);

  if (coverInfo) {
    const coverImageUrl = getCoverImageUrl(coverInfo.coverID);
    res.render("submit.ejs", {
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
  const { coverTitle, authorName, coverImageUrl } = req.body;

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

// back button
app.post("/back", async (req, res) => {
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});

/* 

get homepage copy
 const query = req.query.search_text;
  const coverInfo = await searchBookandCoverId(query);

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
