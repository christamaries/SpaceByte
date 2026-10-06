# SpaceByte
SpaceByte is a web application that helps people who live or train in space-like environments manage what they eat. It combines real-time food inventory tracking, nutrition monitoring, dietary preferences, and an environment toggle (Earth, International Space Station (ISS), Moon) to recommend meals from the food a user actually has on hand. The goals are to avoid menu fatigue, reduce food waste, and make eating in space enjoyable as well as nutritious.

Project Board: https://trello.com/b/8X54wyuJ/spacebyte?utm_source=eval-email&utm_medium=email&utm_campaign=board-invite

# Backend Structure
```text
SpaceByte/
│
├── backend/
│   │
│   ├── node_modules/
│   │
│   ├── src/
│   │   ├── app.js
│   │   │
│   │   ├── config/
│   │   │   └── firebase.js
│   │   │   └── seedFirestore.js
│   │   ├── controllers/
│   │   │   ├── consumptionController.js
│   │   │   ├── inventoryController.js
│   │   │   ├── mealPlanController.js
│   │   │   ├── nutritionController.js
│   │   │   ├── recommendationController.js
│   │   │   ├──resupplyController.js
│   │   │   └── userController.js
│   │   │
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   │
│   │   └── routes/
│   │       ├── consumptionRoutes.js
│   │       ├── inventoryRoutes.js
│   │       ├── mealPlanRoutes.js
│   │       ├── nutritionRoutes.js
│   │       ├── recommendationRoutes.js
│   │       ├── resupplyRoutes.js
│   │       └── userRoutes.js
│   │
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── serviceAccountKey.json
```


