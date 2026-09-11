import axios from "axios";
import { configureApi } from "./configure_api.js";
const auth_api = axios.create({
    baseURL: import.meta.env.VITE_USER_API_END_POINT,
    withCredentials : true

})


export default configureApi(auth_api)


