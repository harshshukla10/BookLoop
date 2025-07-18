# BookLoop - Second-Hand Book Marketplace



**BookLoop** is a full-stack web application designed to connect book lovers. It provides a platform for users to buy, sell, and exchange used books in a friendly and easy-to-use environment. Our goal is to make second-hand books more accessible and to build a community around the joy of reading.

---

## ✨ Key Features

* **User Authentication**: Secure user registration and login system.
* **Book Listings**: Users can easily list their used books for sale or exchange, including details like title, author, condition, price, and photos.
* **Advanced Search & Filtering**: A powerful search functionality allows users to browse books by title, author, genre, or location.
* **Interactive Book Details**: View comprehensive details for each book in a clean, modal-based interface.
* **Seller Interaction**: A built-in "I am Interested" feature notifies the seller and provides the buyer with the seller's contact information to facilitate a direct transaction.
* **User Notifications**: Sellers receive notifications when a user shows interest in one of their books.
* **Responsive Design**: A mobile-first design that ensures a seamless experience on desktops, tablets, and smartphones.

---

## 🛠️ Technologies Used

This project is built with a modern MERN-like stack, using EJS for server-side rendering.

* **Frontend**:
    * HTML5 & CSS3
    * JavaScript (ES6+)
    * [EJS (Embedded JavaScript templating)](https://ejs.co/)
    * [Bootstrap 5](https://getbootstrap.com/) for responsive design and components.

* **Backend**:
    * [Node.js](https://nodejs.org/)
    * [Express.js](https://expressjs.com/)
    * [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM
    * Passport.js for authentication

---

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

* Node.js and npm installed on your machine.
* MongoDB installed locally or a connection string for a cloud instance (e.g., MongoDB Atlas).

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/harshshukla10/bookloop.git
    cd bookloop
    ```

2.  **Install server dependencies:**
    ```sh
    npm install
    ```

3.  **Create a `.env` file** in the root of the project and add your environment variables. Use the `.env.example` file as a template:
    ```env
    PORT=3000
    MONGO_URI=your_mongodb_connection_string
    SESSION_SECRET=a_very_strong_secret
    ```

4.  **Start the development server:**
    ```sh
    npm start
    ```
    The application should now be running at `http://localhost:3000`.

---

## Usage

Once the application is running, you can:
1.  Register for a new account or log in with an existing one.
2.  Browse the collection of listed books on the main page.
3.  Use the "List a Book" feature to add your own books to the marketplace.
4.  Click on a book to view its details.
5.  Click the "I am Interested" button to notify the seller and receive their contact details.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📧 Contact

Harsh Shukla

Project Link: https://bookloop-ek2a.onrender.com/
