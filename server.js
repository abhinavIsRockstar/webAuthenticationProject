const express = require('express');
const app = express();
const joi = require('joi')
const mysql = require('mysql')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')
var cookieParser = require('cookie-parser')
const csurf = require('csurf')
const bodyParser = require('body-parser');
const sessions = require('client-sessions')
// const { join } = require('path');
// const { isBuffer } = require('util');

var csrfProtection = csurf({ cookie: true })
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: false }))
app.set('view engine', 'ejs')
// app.use(express.json())
app.use(bodyParser.json());
app.use('/public',express.static(path.join(__dirname,'static')));
// app.use(csurf()); 

app.use(sessions({
    cookieName: 'session',
    secret:'jsiurn94ua800fj',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly:true,
    secure:true,
    ephemeral:true
}))



app.get('/', (req,res)=>{
    res.render('index.ejs');
})

app.get('/dashboard', (req,res)=>{
    
    // allow only for authenticated user
    if(!(req.session  && req.session.userId)){
        return res.redirect('login')
    } 
    else
    {
        
        const logInEmail = req.session.userId;
        console.log(logInEmail,'log in email at line 37')
        const sqlQuery = `select email from user_info where email='${logInEmail}';`
                       
                        // console.log('inside if ')
                const query = database_connection.query(sqlQuery,(err,result)=>{
                            const raw = result.length;
            
                            console.log((result),'resultt')
                            if(err){
                                throw err;
                            } else  {
                                const raw = result.length;
                                console.log('elsss')
                            if(raw>0){
                                console.log('success');
                                console.log(result,'result for log in');
                                // req.session.userId = request.body.email;
                                res.render('dashboard.ejs',{
                                    email: logInEmail,
                                  
                                })
                                // console.log('inside if ')                               
                            }                
                           
                        }
                    })               
                
                        //    res.render('dashboard.ejs'); 
                 
    }
    
})

app.get('/login', csrfProtection,(req,res)=>{
    res.render('login',{ csurfToken: req.csrfToken() })
    // res.sendFile(path.join(__dirname,'static','login.html'))
})

app.get('/signup',csrfProtection, (req,res)=>{
    res.render('signUp.ejs',{ csurfToken: req.csrfToken() });
    
    // res.sendFile(path.join(__dirname,'static','signup.html'))
})

app.post('/signup', (req,res)=>{
    console.log(req.body);
    // hash the password
    let hash = bcrypt.hashSync(req.body.password,14);
    req.body.password = hash;
    req.body.confirm_password = hash;
    console.log(hash,'hash password');
    // res.render('signUp.ejs');
   
    // Now validation is required for authentication and security purpose

    const schema = joi.object().keys({
        name : joi.string().min(3).max(30).required(),
        email : joi.string().trim().email().required(),
        password: joi.string().min(6).max(200).required(),
        confirm_password : joi.ref('password')

    });
    // schema.validate(req.body)
    const { error, value } = schema.validate(req.body);
    // console.log(result,'result')

     if(error){
         console.log(error,'error')
         res.send(error.details)
     } else {
         console.log(value,'value')
         const password = value.password;
         const repeat_password = value.confirm_password;
         if(password === repeat_password){
          
            // here we will establish a connection to the database and store the data into it.

            let sqlQuery = `SELECT * from user_info WHERE email ='${value.email}';`;
            let query = database_connection.query(sqlQuery,(err,result) =>{
                if (err){
                    throw err
                } else {
                    console.log('inside else')
                    console.log(result,'result')
                    if(result.length==0){
                        // add data into Database
                        const data = {name: `${value.name}`, password:`${value.password}`,
                                      email:`${value.email}`    
                                    }
                        const post = 'INSERT INTO user_info SET ?'
                        const queryPost = database_connection.query(post,data,(err,data)=>{
                            if(err) {
                                throw err
                            } else {
                                console.log(data,'data');
                                // res.send('data added');
                                res.render('login.ejs')
                            }
                        })
                        console.log('hehe')
                    } else {
                        res.send('data already present,dude!')
                    }
                    //res.send('success, You will be redirect to log in page...')
                }
            })


            
         }
         
         
         

     }
      
    
})


// function loginRequired(request,response,next){
//     if(!request.user){
//         return response.redirect('login');
//     }
//     next()
// }

app.post('/login', (request,response)=>{

    // const hash = bcrypt.hashSync(request.body.password,14);
    // request.body.password = hash;

    const logInEmail = request.body.email;
    const logInPassword = request.body.password;
    console.log(logInPassword,'log in password');

    console.log(logInEmail,'log in email');

    const sqlQuery = `select password from user_info where email='${logInEmail}';`

    const query = database_connection.query(sqlQuery,(err,result)=>{
        
        console.log((result[0].password),'resultt')
        if(err){
            throw err;
        } else  {
            const raw = result.length;
            console.log(result[0].password,'elsss')
            
            if(bcrypt.compareSync(request.body.password, result[0].password)){
                console.log('success');
                console.log(result,'result for log in');
                request.session.userId = request.body.email;
                response.render('dashboard.ejs',{
                    email: logInEmail,
                    password: logInPassword
                })
                // console.log('inside if ')
               
            }

            else {
                console.log('incorrect email/password')
                response.render('login',{
                    error: 'Incorrect Email/Password'

                })
            }
            
            // response.send('success');
           
        }
    })
})
// DATABASE CONNECTION AND CREATION

// create a connection

const database_connection = mysql.createConnection({
    host:'localhost',
    user: 'root',
    password:'Abhi9avTiwari',
    database: 'webauthentication_project'
})

// connect to the database

database_connection.connect((err)=>{
    if(err){
        throw err;
    } else {
        console.log('Database Connected!')
    }
})

app.listen(3000);