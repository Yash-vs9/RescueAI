## Backend APIs

POST /api/auth/register 
<br> 
POST /api/auth/login 
<br>  
GET /api/auth/profile (protected)  
<br> 
PUT /api/user/availability (protected)
<br>   
GET /api/user/nearby?lat=&lng=&distance= (protected)
<br>   
POST /api/blood-requests (protected, hospital only)  


## WebSocket (Socket.IO)

- Connection URL: http://localhost:5000  
- Auth: Send JWT token in `auth` object  

**Event for donors:**  
`blood_request` → `{ requestId, hospital, bloodGroup, units, urgency }`  

 
- Real-time notifications to online donors.  
- Notifications through e-mail.
- Offline donors receive notifications automatically when they connect.  
- Only hospitals can create blood requests.  
- JWT protects all sensitive routes.
