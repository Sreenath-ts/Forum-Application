const Tag = require('../model/tag-model')

module.exports = {
    addTags: async(req,res)=>{
        try {
            console.log(req.file,'file here',req.files);
            console.log(req.body,'bodyyyyyyreq');
            const {title,description} = req.body
            let image = req.file.path
            
            const tag = await Tag.create({title,description,image})
    
            res.status(200).json(true)
        } catch (error) {
            if (error.code = 11000) {
               res.status(200).json({err:'Tag name already taken!!'})
            }else{
                res.status(200).json({err:'Internal server error'})
            }
        }
    }
}