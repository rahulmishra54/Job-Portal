import { setAllJobs, setJobsError, setJobsLoading } from '@/redux/jobSlice'
import job_api from '@/api/job_api.js'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const useGetAllJobs = () => {
    const dispatch = useDispatch();
    const {searchedQuery} = useSelector(store=>store.job);
    useEffect(()=>{
        const fetchAllJobs = async () => {
            dispatch(setJobsLoading(true));
            dispatch(setJobsError(null));
            try {
                const res = await job_api.get(`/public?keyword=${encodeURIComponent(searchedQuery)}`);
                if(res.data.success){
                    dispatch(setAllJobs(res.data.jobs));
                } else {
                    dispatch(setJobsError(res.data.message || 'Unable to load jobs.'));
                }
            } catch (error) {
                dispatch(setJobsError(error.response?.data?.message || 'Unable to load jobs.'));
            } finally {
                dispatch(setJobsLoading(false));
            }
        }
        fetchAllJobs();
    },[dispatch, searchedQuery])
}

export default useGetAllJobs