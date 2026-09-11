import axios from "axios";
import { configureApi } from "./configure_api.js";

const company_api = configureApi(axios.create({
    baseURL: import.meta.env.VITE_COMPANY_API_END_POINT,
}))




export default company_api

