# Day 8 Reflection

## 1. What Was the Most Difficult Concept, and How Did I Overcome It?

The most difficult concept for me was preventing two people from purchasing the same seat at the same time. I initially found it challenging to understand how a system could handle hundreds of simultaneous requests without selling the same seat twice. I overcame this by reviewing database transactions, conditional updates, and constraints. I learned that checking seat availability in the application alone is not enough. The database must atomically change the seat's status and allow only one successful transaction to acquire it. This helped me understand why correctness is especially important in ticketing systems.

## 2. Which Part of My Capstone Would I Improve?

I would improve the architecture diagram and the explanation of the ticket-purchasing process. I would make the flow between the waiting room, load balancer, application servers, and database easier to follow. I would also explain more clearly how seat holds expire and how payment confirmation is handled. This would make the design easier for another developer to understand and implement. I would use feedback from my lecturer and classmates to identify any remaining gaps and refine the design.

## 3. What Will I Learn Next?

Next, I plan to learn how to build a real backend using Node.js and Express and connect it to a PostgreSQL database. I also want to practise implementing transactions, authentication, and payment workflows. This will help me move from designing systems on paper to building reliable applications that store data and serve real users.
