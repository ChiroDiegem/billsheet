# Billsheet

An web application to make managing expenses easier.
This project was originally designed for the student organization [VTK](https://vtk.be), but has been modified for use by Chiro Diegem.
However, feel free to fork it or submit a pull request to make it more general!

## Screenshots

<img src='https://github.com/hiasr/billsheet/assets/22374542/ea0f50b8-75a1-48c2-a36a-8d30b3e1bdbc' alt="Expense Form" width='50%'>
<img src='https://github.com/hiasr/billsheet/assets/22374542/39f57d79-810a-4c02-8f78-f13d7cc1c567' alt="Admin Overview" width='50%'>
<img src='https://github.com/hiasr/billsheet/assets/22374542/d2da3d48-8135-4aba-a9e3-ae9f6b8d72c5' alt="Login Form" width='50%'>

## Purpose

The purpose of this project is to manage the expenses for an organization. This tool can keep track of bills that are payed or that still need to be reimbursed.
It includes a clear overview of all expenses and whether the payer has been reimbursed.
Pictures or PDF's of the bills get uploaded to supabase for quick access, and are also copied to a google drive folder for long term storage and backup.

## Usage

You can sign up using any "@chirodiegem.be" mailing address, to be able to log in you need to have verified this address. This is so no users from outside the organization can submit expenses. Once this is done you can fill in the form and your bill will get sent to the finance team!

## Development

To be able to develop this project, you will need an active Supabase instance. A free-tier account is more than enough for development purposes, keep in mind that your project will get paused if there is no interaction with it.

## Deployment

This project relies on Supabase as a database but the Next.js app can be hosted on a service of your preference. [Vercel](https://vercel.com) is probably the easiest though.
