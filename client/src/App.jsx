import { Route, Routes } from "react-router-dom"
import Layout from "./Layout.jsx"
import Home from "./pages/Home.jsx"
import Login from "./pages/Login.jsx"
import Signup from "./pages/Signup.jsx"
import BookDetail from "./pages/BookDetail.jsx"
import MyPage from "./pages/MyPage.jsx"

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout/>}>
        <Route index element={<Home/>} />
        <Route path="login" element={<Login/>} />
        <Route path="signup" element={<Signup/>} />
        <Route path="books/:id" element={<BookDetail/>} />
        <Route path="mypage" element={<MyPage/>} />
      </Route>
    </Routes>
  )
}

export default App
