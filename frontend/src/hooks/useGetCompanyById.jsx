import { setSingleCompany } from '@/redux/companySlice'
import company_api from '@/api/company_api.js'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const useGetCompanyById = (companyId) => {
    const dispatch = useDispatch();
    useEffect(()=>{
        const fetchSingleCompany = async () => {
            try {
                const res = await company_api.get(`/get/${companyId}`, {withCredentials:true});
                console.log(res.data.company);
                if(res.data.success){
                    dispatch(setSingleCompany(res.data.company));
                }
            } catch (error) {
                dispatch(setSingleCompany(null));
            }
        }
        fetchSingleCompany();
    },[companyId, dispatch])
}

export default useGetCompanyById