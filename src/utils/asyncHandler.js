
// handling with Promise
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}


// handling with trycatch 
// const asyncHandler = (requestHandler) => async (err,req, res, next) => {
//     try {
//         await requestHandler(err, req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             sucess:false,
//             message:err.message
//         })
        
//     }
// }

export {asyncHandler}