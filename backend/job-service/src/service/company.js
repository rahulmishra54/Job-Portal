const companyServiceUrl = process.env.COMPANY_SERVICE_URL || "http://localhost:5002";

const getCompanyById = async (companyId, authorization) => {
    const endpoint = authorization ? `/api/v1/company/get/${companyId}` : `/api/v1/company/public/${companyId}`;
    const response = await fetch(`${companyServiceUrl}${endpoint}`, authorization ? {
        headers: { Authorization: authorization }
    } : undefined);

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.company || null;
};

export const attachCompanies = async (jobs, authorization) => {
    return Promise.all(jobs.map(async (job) => {
        const jobData = job.toObject ? job.toObject() : job;
        return {
            ...jobData,
            company: await getCompanyById(jobData.company, authorization)
        };
    }));
};