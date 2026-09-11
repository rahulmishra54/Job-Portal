import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name:"auth",
    initialState:{
        loading:false,
        user:null,
        accessToken:null,
    },
    reducers:{
        // actions
        setLoading:(state, action) => {
            state.loading = action.payload;
        },
        setUser:(state, action) => {
            state.user = action.payload;
        },
        setAccessToken:(state,action)=>{
            state.accessToken = action.payload;
        }
    }
});
export const {setLoading, setUser,setAccessToken} = authSlice.actions;
export default authSlice.reducer;