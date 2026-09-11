import { setAllAdminJobs } from '@/redux/jobSlice'
import job_api from '@/api/job_api.js'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const useGetAllAdminJobs = () => {
    const dispatch = useDispatch();
    const {accessToken} = useSelector(store=>store.auth);
    useEffect(()=>{
        dispatch(setAllAdminJobs([]));
        if (!accessToken) return;
        const fetchAllAdminJobs = async () => {
            try {
                const res = await job_api.get('/getadminjobs', {withCredentials:true});
                if(res.data.success){
                    dispatch(setAllAdminJobs(res.data.jobs));
                }
            } catch (error) {
                console.error(error.response?.data?.message || error.message);
            }
        }
        fetchAllAdminJobs();
    },[accessToken, dispatch])
}

export default useGetAllAdminJobs