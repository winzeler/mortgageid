# mortgageid.com
Decentralized Identity for mortgage credit applications with Verida (overlayed on NEAR?), for GraphHack 2022


### Requirements

- Node 14.17.1
- yarn 1.22.18
- es-list
- Docker Desktop (nginx, postgres, express, app/api)

- setup-dev.sh (installs cmd line scripts for docker startup)
- run-dev.sh 

# MortgageId

## Inspiration

We want to put credit reports on the block chain and change the way that credit reports work today, often harming consumers.
From 2008 - 2016, I worked in the mortgage industry and saw these problems first hand.  This hybrid web3 concept is focused on credit reports for traditional finance, but could extend to DeFi oriented credit scoring, depending on how that shapes up in the near future.

## What it does

[Video Walkthrough](https://youtu.be/MgZZoEcG0cA)

[MortgageID](https://mortgageid.com/) writes personal credit data to block chain storage using Verida.  Essentially we put the credit score, and eventually the live credit reports and thin loan application on the block chain.  Using decentralized identity we can give back control of access to credit data to the individual.

- Solves for bad customer experience when shopping for a mortgage. Apply for a mortgage and get 10-15 annoying calls for weeks from salespersons.  

- Solves for rate shopping.  No need to get your credit pulled a half dozen times.  MortgageID will solve this by putting live credit on the block chain using Verida and controlling lender access.

- Lenders can cut out the sales commission, often totaling 2-4 points of the loan, and partner with MortgageID to find qualified borrowers by connecting through Verida's secure messaging system to find pre-qualified borrowers.

- Lastly, and most important, solves for **discrimination in lending** by completely removing personal information from the front end of the loan process. Giving users a MortgageID wallet will actually address fair lending for the first time since the 70s. The current approach is government run HMDA surveys followed by fines to the worse offenders.

  __MortgageId & Verida give the borrower control over their data!  It enables users to store private borrower credit info, reports where the user can give access to approved lenders securely.  Lenders can send loan offers securely through the blockchain.__ 


## How we built it

It's a proof of concept.  I spun up a NodeJS boilerplate app that uses VueJs in order to integrate with Verida's new Vue starter kit.  I then coded a Controller/Model service design for users to input self-attested credit scores as a proof of concept. This data was written to the storage server API.  

[https://www.verida.io/](https://www.verida.io/)

I ended up not using the Verida Mobile wallet beyond initial attempts to integrate with their SSO QR VueJS sdk. The storage server data is not viewable in the current mobile app, due to lack of structured schema.

[https://github.com/winzeler/mortgageid](https://github.com/winzeler/mortgageid)

## Challenges I ran into

In my FT job with HaHa.me, a crypto portfolio mobile app, I'm entirely on the backend/database for that Reactive Native environment. For MortgageID, I had to decide how to start up an app to test these APIs.  Command line?  Web app?  I had no prior experience with VueJs, so trying to integrate the Verida web components in Vue3 into my demo was the biggest delay.

There was an issue in the Verida docs around the __didServerUrl__ property that required me to pull down the source code to find out what it was failing.  [https://developers.verida.io/docs/client-sdk/authentication](https://developers.verida.io/docs/client-sdk/authentication)

## Accomplishments that we're proud of

Everything runs nicely in Docker, the app, nginx, api express server and postgres.  Should make deployment a breeze.  The scaffolding setup for the Graphhack demo will make it straightforward to add features (once I really grok Vue).

## What we learned

Open source is best. Cracking open Verida repos... auth.ts and figuring out what the docs left out was a lifesaver.

Solo hacking was faster to get going but when I faced issues, there was no collaboration.  I tried to recruit several hackers to work on the Verida APIs to no avail!

## What's next for MortgageID.com

Integrate with a legacy credit provider.  ...possibly Equifax, where we've got access to a sandbox API account.  Store JSON credit reports in Verida.  Build an easy to use credit wallet mobile app in React Native.   Once we can integrate with live credit, we need to pull in other parts of the loan application.  Next, build out a dashboard or lender partners to access user's credit and application data securely and anonimized. 



[Demo Link](https://mortgageid.com) __coming soon__


[Verida Explorer Link](https://verida.network/did/did:vda:0xF39eA91b028cC1D81bDf1c924C12313D571Ef2Ef)



## Built with


Verida.io SDKs, Verida TESTNET, Javascript, NodeJS, Express, Nginx, Docker, Postgres, SocketLabs email, Vue3, TailwindCSS, Node app boilerplate


