import * as  Web3 from "@solana/web3.js"
import * as  fs from "fs"
import dotenv from "dotenv"
import { web3 } from "@project-serum/anchor"
dotenv.config()
const PROGRAM_ID = new Web3.PublicKey("ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa")
const PROGRAM_DATA_PUBLIC_KEY = new Web3.PublicKey("Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod")

async function createKeyPair(connection:Web3.Connection): Promise<Web3.Keypair> {
    if(!process.env.PRIVATE_KEY){
        console.log("creating a keypair ...")
        const signer=Web3.Keypair.generate()

        console.log("creating .env file")
        fs.writeFileSync('.env',`PRIVATE_KEY=[${signer.secretKey.toString()}]`)
        await airDropSolIfNeeded(signer,connection)

        return signer;
    }

    const secret=JSON.parse(process.env.PRIVATE_KEY ?? "") as number[]
    const uint8Array=Uint8Array.from(secret)
    const keyPairFromSecret=Web3.Keypair.fromSecretKey(uint8Array)
    return keyPairFromSecret;


}

async function airDropSolIfNeeded(signer:Web3.Keypair,connection:Web3.Connection){
     
    const balance=await connection.getBalance(signer.publicKey)

    console.log("current balance is :", balance/Web3.LAMPORTS_PER_SOL, "SOL")

    if( balance/Web3.LAMPORTS_PER_SOL<1){

        console.log("airdropping SOL...")
        const airdropSignature=await  connection.requestAirdrop(signer.publicKey,Web3.LAMPORTS_PER_SOL)

        const latestBlockhash=await connection.getLatestBlockhash()
        await connection.confirmTransaction({
            blockhash:latestBlockhash.blockhash,
            lastValidBlockHeight:latestBlockhash.lastValidBlockHeight,
            signature:airdropSignature
        })

        const newBalance= await connection.getBalance(signer.publicKey)
        console.log("New Balance is:", newBalance/Web3.LAMPORTS_PER_SOL, "SOL")
    }
}
async function pingProgram(connection:Web3.Connection,payer:Web3.Keypair){

    const transaction=new Web3.Transaction()
    const instruction=new Web3.TransactionInstruction({
        keys:[
            {
            pubkey:PROGRAM_DATA_PUBLIC_KEY,
            isSigner:false,
            isWritable:true
            }
        ],
        programId:PROGRAM_ID,

    
})
    transaction.add(instruction)
    const transactionSignature=await Web3.sendAndConfirmTransaction(connection,transaction,[payer])
    console.log(
        `Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
        )
}
/**
 * 
 * @param connection 
 * @param payer 
async function transferFun(connection:Web3.Connection,payer:Web3.Keypair){
    const transaction=new web3.Transaction()
    const senderPubkey=new Web3.PublicKey("6nHp1ZE4i6CCqGrrNS5Xy7EVT2t32geqaJf8HgCz2pN")
    const senderAccount=await connection.getAccountInfo(senderPubkey)
    const receiverPubkey=new Web3.PublicKey("2k9xWV17gzN68yNhEAGzqcf2jMN8dqyBX9o5ZpmXo5ts")
    const transferInstruction= Web3.SystemProgram.transfer({
        fromPubkey:senderPubkey,
        toPubkey:receiverPubkey,
        lamports:0.2
    })
     transaction.add(transferInstruction)
     const transactionSignature=await Web3.sendAndConfirmTransaction(connection,transaction,[])
    }
    */
   async function transferFunc(connection:web3.Connection,amount:number,from:web3.Keypair,to:web3.PublicKey){
       
    const transaction=new Web3.Transaction()
    const transferInstruction= Web3.SystemProgram.transfer({
        fromPubkey:from.publicKey,
        toPubkey:to,
        lamports:amount
    })
    transaction.add(transferInstruction)
    const transactionSignature= await Web3.sendAndConfirmTransaction(connection,transaction,[from])
    console.log( `Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`)
}

async function main() {
    const connection=new Web3.Connection(Web3.clusterApiUrl('devnet'),{"commitment":"confirmed"})
    const signer=await createKeyPair(connection)
console.log("Public_Key: ",signer.publicKey.toBase58())

await pingProgram(connection,signer)
}

main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
