-- Fix admin status for thematchupcompany@gmail.com
UPDATE User 
SET status = 'ACTIVE'
WHERE email = 'thematchupcompany@gmail.com' AND role = 'TOURNAMENT_ADMIN'; 