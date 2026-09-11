import { useEffect } from 'react'
import Navbar from '../shared/Navbar'
import ApplicantsTable from './ApplicantsTable'
import application_api from '@/api/application_api.js';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAllApplicants } from '@/redux/applicationSlice';

const Applicants = () => {
    const params = useParams();
    const dispatch = useDispatch();
    const {applicants} = useSelector(store=>store.application);

    useEffect(() => {
        const fetchAllApplicants = async () => {
            try {
                const res = await application_api.get(`/${params.id}/applicants`, { withCredentials: true });
                if(res){
                    console.log("api is working")
                }
                console.log("Applicants data:", res.data.job);
                dispatch(setAllApplicants(res.data.job));
            } catch (error) {
                console.log(error);
            }
        }
        fetchAllApplicants();
    }, [dispatch, params.id]);
    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto'>
                <div className='flex flex-wrap items-center justify-between gap-4 my-5'>
                    <h1 className='font-bold text-xl'>Applicants {applicants?.applications?.length}</h1>
                </div>
                <ApplicantsTable />
            </div>
        </div>
    )
}

export default Applicants