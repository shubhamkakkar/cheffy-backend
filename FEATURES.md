# Feature Completion

It consists all the features of the app. If there's some feature missing in any module please add it.
Please also mark features as one of: done, incomplete, doing, unsure

**Modules**

**User**
`/user`
1. ‘/‘register: done
2. `/resend-emailtoken`: resend-email-token: done
3. `/verify-email-token`: verify-email-token: done
4. `/complete-registration`: complete-registration: done
5. `/verifyphone`: verify-phone:done
6. `/confirmphone`: checkPhone: done
7. `/edit`: update-profile: done: done
8. `/login`: login: done
9. `/verifypassword`: verify-change-password (confirm current password, send phone token): 
10. `/forgot-password` forgot-password(send token to email): done
11. `/changepassword` changePassword(forgot-password-process): done
12. `/`: getuser: done
13. `/balance`: getUserBalance : todo
14. `/balance/history?:from:to`: Get User Balance History: todo
15. `/search/:text`: Search Plates and Restaurants: done
16. `/messages/users`: List User messages: unsure
17. `/messages/users/:to_userID`: Create User Messages: unsure
18. `/messages/users/:to_userID`: Messages from user: unsure
19. Social Login Facebook: ongoing
20. Social Login Google: ongoing

**Driver**
`/driver`
1. `/position`: Update Driver Position: done
2. `/get-position`: Get Driver Position: done
3. `/bank-account`: Create Driver Bank Account: done
4. Delete Driver Bank Account: incomplete | No API route in cheff app but there’s api in driver app

**Shipping** 
`/shipping`
1. `/`: Create User shipping Address: done
2. `/`: Get Users Shipping Addresses: done
3. `/edit/:id`: Edit User Shipping Address: done

**Documents**
`/docs`
1. `/`: Create User Doc: done
2. `/` Update Doc: done
3. `/my`: My Doc: done
4. `/chefLicense` Upload Chef License photo: done
5. `/chefCertificate`: Upload Chef Certificate photo: done
6. `/kitchenPhoto` Upload Plate Kitchen photo: done
7. `/nidFrontSide` Upload User NID photo: done
8. `/profilePhoto` Upload User Profile Picture: done
9. `/socialSecurityNumber` Add user Social Security Number: done
10. `/driverLicense` Upload Driver License photo: done
11. `/vehicleRegistration` Upload Driver Vehicle Registration: done
12. `/` List User Docs List User Docs: done | if a user has only one doc do we need this?

**Category**
`/category`
1. `/`: Add Category: done
2. `/edit/:id`: Edit Category: done
3. `/`: List Categories: done
4. `/`: List Category Plates: done
5. Search Plates By category: incomplete | it seems incomplete

**Plates**
`/plate`
1. `/`: Create Plate: done
2. `/`: List Plates: done
3. `/images/:id`: Upload Plate Images: done
4. `/images/:type_image/:id` Delete Plate Image: done
5. `/edit/:id`: Edit Plate: done
6. `/:id`: Delete Plate: done
7. `/search/:text`: Search Plates: done
8. `/show/:id`: Get Plate: done
9. `/:id/kitchen`: Plate Kitchen Images: done
10. `/:id/review`: Plate Reviews:
11. `/:id/related`: Plate Related: done
12. `/near`: Near Plate: done
13. `/latest/:amount`: Search Plate by amount: done
14. `/chef/:id`: Specific Chef Plates: done
15. `/:id/receipt`: Plate Receipts: done

**Custom Plate**
`/custom-plate`
1. `/` Add Custom Plate: done
2. `/` Get Custom Plates: done
3. `/:customPlateId`: Get one custom plate: done
4. `/bid` Chef Bid to CustomPlate: done
5. `/accept/bid/:auctionBidId` User Accept Custom Bid From Chef: done
6. `/pay` Pay User Custom Order: ongoing | issue in post payment 
7. `/order/list/:userId`: List User Custom Orders: done

**Favourites**
`/favourites`
1. Add plate/custom plate to favourites: done
2. Remove plate/custom plate from favourites: done
3. List User Favourites: todo


**Basket**
`/basket`
1. `/`: Add plate to user basket. Also handles plate quantity update to basket item: done
2. `/` Get user basket items: done
3. `/subtract/:basketItemId`: Subtract basket item quantity by 1: done
4. `/delete/:basketItemId`: Delete basket item: done
5. `/add/:basketItemId`: Add 1 to basket item quantity : done
6. User also bought API: ongoing

**Card**
`/card`
1. `/`: List User Cards from stripe: done
2. `/`: Add new Card to stripe: done


**Order**
`/order`
1. `/`: Create Order: ongoing | Issue in post payment | database design issue
2. `/ready-delivery`: Orders Ready for Delivery:  todo
3. `/list`: List Orders: todo
4. `/list/tracking`: List Order tracking: todo
5. `/get/:id`: Get Order By Id: done
6. `/:id/review`: Create Order review:
7. ``: Get Order Reviews: 

**Delivery**
`/delivery`
1. `/`: Get All Deliveries of an authenticated user: done
2. `/complete`: Get Completed Deliveries of an auth user: done
3. `/:id`: Get Delivery By Id: done
4. `/edit/:id`: Edit Delivery By Id: done
5. `/accept/:id`: Accept Delivery by Driver/Chef: done
6. `/decline/:id`: Decline Delivery by Driver/Chef: done
7. `/createdelivery/:id`: Create Driver/Chef: done
8. `/pickup/:id`: Pickup Delivery By Driver/Chef: done
9. `/complete/:id`: Complete Delivery By Driver/Chef: done

**Admin**
`/admin`
1. List User Docs: unsure
2. Edit Docs: unsure
