import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Home from './components/Home'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/Profile'
import JobDescription from './components/JobDescription'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from "./components/admin/AdminJobs";
import PostJob from './components/admin/PostJob'
import Applicants from './components/admin/Applicants'
import ProtectedRoute from './components/admin/ProtectedRoute'
import {useDispatch } from 'react-redux'
import { setAccessToken, setUser } from './redux/authSlice'
import {useSelector} from 'react-redux'
import { useEffect } from 'react'
import auth_api from './api/auth_api.js'


const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: "/jobs",
    element: <Jobs />
  },
  {
    path: "/description/:id",
    element: <JobDescription />
  },
  {
    path: "/browse",
    element: <Browse />
  },
  {
    path: "/profile",
    element: <Profile />
  },
  // admin ke liye yha se start hoga
  {
    path:"/admin/companies",
    element: <ProtectedRoute><Companies/></ProtectedRoute>
  },
  {
    path:"/admin/companies/create",
    element: <ProtectedRoute><CompanyCreate/></ProtectedRoute> 
  },
  {
    path:"/admin/companies/:id",
    element:<ProtectedRoute><CompanySetup/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs",
    element:<ProtectedRoute><AdminJobs/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/create",
    element:<ProtectedRoute><PostJob/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/:id",
    element:<ProtectedRoute><PostJob edit/></ProtectedRoute>
  },
  {
    path:"/admin/jobs/:id/applicants",
    element:<ProtectedRoute><Applicants/></ProtectedRoute> 
  },
])
function App() {
  const { user } = useSelector(store => store.auth);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!user) return;
    const getAccessToken = async () => {
        try {
            const res = await auth_api.get("/refresh");

            if (res.data.success) {
                dispatch(setAccessToken(res.data.accessToken));
            }
        } catch (error) {
          dispatch(setAccessToken(null));
          dispatch(setUser(null));
            console.log(
                error.response?.data?.message || error.message
            );
        }
    };

    getAccessToken();
    const interval = setInterval(getAccessToken, 14 * 60 * 1000);

    return () => clearInterval(interval);
}, [user, dispatch]);

 
  return (

    <div>
      <RouterProvider router={appRouter} />
    </div>
  )
}

export default App
