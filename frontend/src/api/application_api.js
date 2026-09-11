import axios from "axios";
import { configureApi } from "./configure_api.js";


const applcation_api = configureApi(axios.create({
    baseURL : import.meta.env.VITE_APPLICATION_API_END_POINT,
}))


export default applcation_api