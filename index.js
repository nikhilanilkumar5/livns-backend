const express = require('express')
const app = express()
app.set("view engine", "pug");
const port = 3001
const mysql = require('mysql')
var cors = require('cors')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const multer = require('multer');
const path = require('path');
const bcrypt = require("bcrypt");
const { send } = require('process');
const saltRounds = 8;

var latestFile
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        // const { originalname } = file;
        // or 
        // uuid, or fieldname
        cb(null, `${file.originalname}`);
        latestFile = file.originalname
    }
})
const upload = multer({ storage }); // or simply { dest: 'uploads/' }
app.use(express.static('public'))
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});
// app.get('/upload', jsonParser, (req, res) => {
//     res.render('upload');
// });
app.post('/upload', upload.single('image'), function (req, res) {
    res.send(JSON.stringify({
        success: true,
        url: `uploads/${latestFile}`
    }));
});
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db'
})
app.use(cors())
con.connect()
app.get('/user', (req, res) => {
    let qr = `SELECT * FROM user_account`
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
    })
})
app.get('/brands', (req, res) => {
    let qr = `SELECT * FROM brands`
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
    })
})
app.get('/brands/:id', (req, res) => {
    let id = req.params.id.slice(1)
    // console.log(id)
    let qr = `SELECT * FROM follow_rel INNER JOIN brands ON brands.brandid = follow_rel.brand_id WHERE follow_rel.user_id = ${id} AND follow_rel.active=1 ORDER BY follow_rel.id DESC`
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
        // console.log(result)
    })

})
// app.get('/brandsfollow/:id', (req, res) => {
//     let id = req.params.id.slice(1)
//     console.log(id)
//     let qr =`SELECT follow_rel.brand_id FROM follow_rel INNER JOIN brands ON brands.brandid = follow_rel.brand_id WHERE follow_rel.user_id = ${id} AND follow_rel.active=1 ORDER BY follow_rel.id DESC`
//     con.query(qr, (err, result, fields) => {
//         if (err) throw (err);
//         let brandsid = result;
//         let qr2 = `SELECT brandid FROM brands`
//     con.query(qr2, (err, resp, fields) => {
//         if (err) throw (err);
//         console.log("brands",resp)
//         // brandsid.forEach(element => {
//         //     if (resp == brandsid) {
//         //         console.log(resp)
//         //     }
//         //     else {
//         //         console.log("error")
//         //     }
//         //   });
//     })
//     })

// })
app.get('/following', (req, res) => {
    let qr = `SELECT * FROM following`
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
    })
})
app.get('/following/:id', (req, res) => {
    let id = req.params.id.slice(1)
    // console.log(id)
    let qr = `SELECT * FROM follow_rel INNER JOIN following ON following.followingid = follow_rel.follow_id WHERE follow_rel.user_id = ${id} AND follow_rel.active=1 ORDER BY follow_rel.id DESC`
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
        // console.log(result)
    })

})
app.get('/user-brands', (req, res) => {
    let qr = `SELECT * FROM follow_rel`
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
    })
})
app.post('/admin', jsonParser, (req, res) => {
    let userid = req.body.userid;
    let qr = `SELECT propic FROM user_details   WHERE user_id =${userid} `
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
        // console.log(result)
    })
})
app.post('/login', jsonParser, (req, res) => {
    let email2 = req.body.email;
    let password2 = req.body.password;
    let qr = `SELECT email , password FROM user_account WHERE email = '${email2}' `

    con.query(qr, (err, result) => {
        if (err) throw (err);
        let stored_hash = result[0].password;
        bcrypt.compare(password2, stored_hash, function (err, resp) {
            // console.log(resp)
            if (resp == true) {
                let qr = `SELECT id ,firstname, lastname, email,  gender, country  FROM user_account WHERE email = '${email2}' `

                con.query(qr, (err, result) => {
                    // console.log(result[0])
                    res.send(result[0])
                })
            }
            else {
                return res.status(401).send({ message: "email or password mismatch found" });
            }
        });
    })
})
//     else {
//       Users.filter(function(user){
//          if(user.id === req.body.id){
//             res.render('signup', {
//                message: "User Already Exists! Login or choose another user id"});
//          }
//       });
//         res.send(result);
//    
// })
app.post('/user', jsonParser, async (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let passwordcrypt = req.body.password;
    let password = await bcrypt.hash(passwordcrypt, saltRounds)
    let gender = req.body.gender;
    let country = req.body.country;
    let qr = `SELECT email  FROM user_account WHERE email = '${email}' `
    con.query(qr, (err, result) => {
        // console.log(result.length)
        if (result.length > 0) {
            return res.status(401).send({ message: "Email Address already Used" });
        }
        else {
            let qr = `insert into user_account(firstname,lastname,email,password,gender,country) values ('${firstname}','${lastname}','${email}','${password}','${gender}','${country}')`;
            con.query(qr, (err, result, fields) => {
                if (err) res.status(err.statusCode).send({ message: err.message });
                let qr = `SELECT id ,firstname, lastname, email,  gender, country  FROM user_account WHERE email = '${email}' `

                con.query(qr, (err, result) => {
                    // console.log(result[0])
                    res.send(result[0])
                })
            });
        }
    })
})
app.post('/user-details', jsonParser, (req, res) => {
    let propic = req.body.propic;
    let men = req.body.men ? 1 : 0;
    let women = req.body.women ? 1 : 0;
    let kids = req.body.kids ? 1 : 0;
    let pincode = req.body.pincode;
    let userid = req.body.userid;
    let qr = `insert into user_details(user_id,propic,men,women,kids,pincode) values ('${userid}','${propic}','${men}','${women}','${kids}','${pincode}')`;
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
    })
})
app.post('/user-brands', jsonParser, (req, res) => {
    let brandid = req.body.brandid;
    let active = req.body.active;
    let userid = req.body.userid;
    let qr = `select brand_id FROM follow_rel WHERE brand_id ='${brandid}'`;
    con.query(qr, (err, resp, fields) => {
        console.log(resp[0])
        if (resp[0]==undefined) {
            let qr2 = `insert into follow_rel(user_id,brand_id,active) values ('${userid}','${brandid}','${active}')`;
            con.query(qr2, (err, result, fields) => {
                if (err) throw (err);
                res.send(result);
            })
        }
        else {
            let qr = `update follow_rel set user_id=${userid},brand_id=${brandid},active =${active} WHERE brand_id=${brandid}`;
            con.query(qr, (err, result, fields) => {
                if (err) throw (err);
                res.send(result);
            })
        }
    })

})
app.put('/user-brands', jsonParser, (req, res) => {
    let brandid = req.body.brandid;
    let active = req.body.active;
    let userid = req.body.userid;
    let qr = `update follow_rel set user_id=${userid},brand_id=${brandid},active =${active} WHERE brand_id=${brandid}`;
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
    })
})
app.post('/user-following', jsonParser, (req, res) => {
    let followid = req.body.followid;
    let active = req.body.active;
    let userid = req.body.userid;
    let qr = `insert into follow_rel(user_id,follow_id,active) values ('${userid}','${followid}','${active}')`;
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
    })
})
app.put('/user-following', jsonParser, (req, res) => {
    let followid = req.body.followid;
    let active = req.body.active;
    let userid = req.body.userid;
    let qr = `update follow_rel set user_id=${userid},follow_id=${followid},active =${active} WHERE follow_id=${followid}`;
    con.query(qr, (err, result, fields) => {
        if (err) throw (err);
        res.send(result);
    })
})
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
