import { setCompanies, setCompaniesError } from '@/redux/companySlice'
import company_api from '@/api/company_api.js'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const useGetAllCompanies = () => {
    const dispatch = useDispatch();
    const {accessToken} = useSelector(store=>store.auth);
    useEffect(()=>{
        dispatch(setCompaniesError(null));
        if (!accessToken) return;
        const fetchCompanies = async () => {
            try {
                const res = await company_api.get('/get');
                if(res.data.success){
                    dispatch(setCompanies(res.data.companies));
                }
            } catch (error) {
                dispatch(setCompaniesError(error.response?.data?.message || 'Unable to load companies.'));
                console.error(error.response?.data?.message || error.message);
            }
        }
        fetchCompanies();
    },[accessToken, dispatch])
}

export default useGetAllCompanies