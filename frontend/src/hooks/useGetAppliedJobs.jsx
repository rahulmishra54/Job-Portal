import { setAllAppliedJobs } from "@/redux/jobSlice";
import application_api from "@/api/application_api.js";
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

const useGetAppliedJobs = () => {
    const dispatch = useDispatch();
    const {accessToken} = useSelector(store=>store.auth);

    useEffect(()=>{
        if (!accessToken) {
            dispatch(setAllAppliedJobs([]));
            return;
        }
        const fetchAppliedJobs = async () => {
            try {
                const res = await application_api.get('/get', {withCredentials:true});
                if(res.data.success){
                    dispatch(setAllAppliedJobs(res.data.application));
                }
            } catch (error) {
                console.error(error.response?.data?.message || error.message);
            }
        }
        fetchAppliedJobs();
    },[accessToken, dispatch])
};
export default useGetAppliedJobs;