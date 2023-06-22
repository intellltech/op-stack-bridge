import React, { useEffect, useState } from 'react'
import { Table } from "react-bootstrap";
import { useAccount } from 'wagmi'
import { ethers } from "ethers"
const optimismSDK = require("@eth-optimism/sdk")
const WithdrawAccount = () => {
    const { address, isConnected } = useAccount()
    const [withdrawDetails, setWithdrawDetails] = useState([])
    const getWithdraw = async () => {
        // const l1Provider = new ethers.providers.Web3Provider(window.ethereum,"any");
        // const l2Provider = new ethers.providers.JsonRpcProvider('https://racetestnet.io');
        const l2Url = `https://racetestnet.io`
        const l1Provider = new ethers.providers.Web3Provider(window.ethereum,"any");
        const l2Provider = new ethers.providers.JsonRpcProvider(l2Url)
        const l1Signer = l1Provider.getSigner(address)
        const l2Signer = l2Provider.getSigner(address)
        const zeroAddr = "0x".padEnd(42, "0");
        console.log(l1Signer)
        console.log(l2Signer)
        const l1Contracts = {
            StateCommitmentChain: zeroAddr,
            CanonicalTransactionChain: zeroAddr,
            BondManager: zeroAddr,
            AddressManager: process.env.REACT_APP_LIB_ADDRESSMANAGER,
            L1CrossDomainMessenger: process.env.REACT_APP_PROXY_OVM_L1CROSSDOMAINMESSENGER,
            L1StandardBridge: process.env.REACT_APP_PROXY_OVM_L1STANDARDBRIDGE,
            OptimismPortal: process.env.REACT_APP_OPTIMISM_PORTAL_PROXY,
            L2OutputOracle: process.env.REACT_APP_L2_OUTPUTORACLE_PROXY,
        }
        // console.log(l1Contracts);
        const bridges = {
            Standard: {
                l1Bridge: l1Contracts.L1StandardBridge,
                l2Bridge: "0x4200000000000000000000000000000000000010",
                Adapter: optimismSDK.StandardBridgeAdapter
            },
            ETH: {
                l1Bridge: l1Contracts.L1StandardBridge,
                l2Bridge: "0x4200000000000000000000000000000000000010",
                Adapter: optimismSDK.ETHBridgeAdapter
            }
        }
        const crossChainMessenger = new optimismSDK.CrossChainMessenger({
            contracts: {
                l1: l1Contracts,
            },
            bridges: bridges,
            l1ChainId: Number(process.env.REACT_APP_L1_CHAIN_ID),
            l2ChainId: Number(process.env.REACT_APP_L2_CHAIN_ID),
            l1SignerOrProvider: l1Signer,
            l2SignerOrProvider: l2Signer,
            bedrock: true,
        })
        const data = await crossChainMessenger.getWithdrawalsByAddress(address)
        // console.log(data);
        for (let index = 0; index < data.length; index++) {
                let timestamp = (await l2Provider.getBlock(data[index].blockNumber)).timestamp;
                let getStatus = await crossChainMessenger.getMessageStatus(data[index].transactionHash)
                data[index].messageStatus = getStatus
                data[index].timestamp = timestamp
        }
        // console.log(data);
        const getNewWithdrawals = data.map(object => {
            if (object.messageStatus == 6) {
                return { ...object, message: 'Completed' };
            } else if (object.messageStatus == 3) {
                return { ...object, message: 'Ready to Prove' };
            }
            else if (object.messageStatus == 5) {
                return { ...object, message: 'Claim Withdrawal' };
            }
            else if (object.messageStatus == 2) {
                return { ...object, message: 'Waiting for Confirmation' };
            }
            else if (object.messageStatus == 4) {
                return { ...object, message: 'In challenge Period' };
            }
            else {
                return { ...object, message: null };
            }
        });
        setWithdrawDetails(getNewWithdrawals)
        console.log("data", getNewWithdrawals);
    }
    function timeConverter(timestamp) {
        var a = new Date(timestamp * 1000);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
        return time;
    }

    const handleProve = async (transactionHash) => {

    }

    const handleClaim = async (transactionHash) => {
        
    }

    useEffect(() => {
        console.log(address);
        getWithdraw()
    }, [])

    
    return (
        <>
            <section className="account_withdraw_table">
                <Table responsive bordered hover variant="dark">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Transaction</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawDetails.map((element, index) => {
                            const { timestamp, message, transactionHash, amount, messageStatus } = element
                            console.log("amount", amount._hex);
                            return (
                                <tr key={index}>
                                    <td>{timeConverter(timestamp)}</td>
                                    <td>Withdraw</td>
                                    <td>{parseInt(amount._hex, 16) / 1000000000000000000} ETH</td>
                                    <td>{`${transactionHash.slice(0, 8)}...${transactionHash.slice(-8)}`}</td>
                                    <td>{message} {messageStatus === 3 ? <button type='button' className='btn withdraw_inner_btn' onClick={() => handleProve(transactionHash)}>Prove</button> : messageStatus === 5 ? <button type='button' className='btn withdraw_inner_btn' onClick={() => handleClaim(transactionHash)}>Claim</button> : ""} </td>
                                </tr>
                            )
                        })}

                    </tbody>
                </Table>
                {/* {!checkMetamaskTest && <MetamaskPopUp />} */}
            </section>
        </>
    )
}

export default WithdrawAccount