import axios from "axios";
import { configureApi } from "./configure_api.js";


const job_api = configureApi(axios.create({
    baseURL: import.meta.env.VITE_JOB_API_END_POINT,
}))

export default job_api
