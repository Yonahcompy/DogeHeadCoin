import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

const handleSolanaBuy = async (amount: number) => {
  try {
    const provider = getProvider();
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    
    const program = getProgram();
    if (!program || !solanaPublicKey) {
      throw new Error('Program or wallet not initialized');
    }

    // Get the transaction record PDA
    const [transactionRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction_record")],
      program.programId
    );

    // Get the treasury PDA
    const [treasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    // Check if the transaction record account exists
    const transactionRecordInfo = await connection.getAccountInfo(transactionRecord);
    if (!transactionRecordInfo) {
      throw new Error('Transaction record account not found. Contract may not be initialized.');
    }

    // Call the buy instruction
    const tx = await program.methods
      .buy(new BN(amount))
      .accounts({
        buyer: solanaPublicKey,
        treasury: treasury,
        transactionRecord: transactionRecord,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Solana buy error:', error);
    throw error;
  }
};

const handleBuyTokens = async () => {
  if (!solanaConnected) {
    toast.error('Please connect your Solana wallet first', {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...toastStyles,
    });
    return;
  }

  if (Number(amount) < 1) {
    toast.error('Minimum purchase amount is $1', {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...toastStyles,
    });
    return;
  }

  if (selectedPaymentChain === 'solana') {
    if (!isInitialized) {
      toast.error('Contract not initialized. Please contact the admin.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
      return;
    }
  } else {
    // For EVM chains, we need EVM connection
    if (!evmConnected || !selectedPaymentChain) {
      toast.error('Please connect your payment wallet and select a payment chain', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
      return;
    }
  }

  setIsProcessing(true);
  toast.info('Processing transaction...', {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...toastStyles,
  });

  try {
    if (selectedPaymentChain === 'solana') {
      // Convert amount to a number and ensure it's valid
      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }

      const tx = await handleSolanaBuy(amountNum);

      toast.success(`Transaction submitted! Hash: ${tx}`, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
    } else if (selectedPaymentChain === 'base') {
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      // Convert amount to cents (multiply by 100)
      const amountInCents = BigInt(Math.floor(parseFloat(amount)));

      // Get quote for ETH amount
      const quote = await publicClient.readContract({
        ...BASE_ETH_CONTRACT,
        functionName: 'getQuote',
        args: [amountInCents],
      }) as bigint;

      // Make the purchase
      const hash = await walletClient.writeContract({
        ...BASE_ETH_CONTRACT,
        functionName: 'purchaseWithUSDAmount',
        args: [amountInCents, solanaPublicKey?.toString() || ''],
        value: quote,
      });

      toast.success(`Transaction submitted! Hash: ${hash}`, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'success') {
        toast.success('Transaction confirmed! Doge-Head tokens will be sent to your Solana wallet.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          ...toastStyles,
        });
      } else {
        throw new Error('Transaction failed');
      }
    } else if (selectedPaymentChain === 'bsc') {
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      // Convert amount to cents (multiply by 100)
      const amountInCents = BigInt(Math.floor(parseFloat(amount)));

      // Get quote for BNB amount
      const quote = await publicClient.readContract({
        ...BSC_CONTRACT,
        functionName: 'getQuote',
        args: [amountInCents],
      }) as bigint;

      // Make the purchase
      const hash = await walletClient.writeContract({
        ...BSC_CONTRACT,
        functionName: 'purchaseWithUSDAmount',
        args: [amountInCents, solanaPublicKey?.toString() || ''],
        value: quote,
      });

      toast.success(`Transaction submitted! Hash: ${hash}`, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'success') {
        toast.success('Transaction confirmed! Doge-Head tokens will be sent to your Solana wallet.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          ...toastStyles,
        });
      } else {
        throw new Error('Transaction failed');
      }
    } else {
      // Simulate transaction for other chains (replace with actual implementation)
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Transaction successful! Doge-Head tokens will be sent to your Solana wallet.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
    }
  } catch (error) {
    console.error('Transaction error:', error);
    toast.error('Transaction failed. Please try again.', {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...toastStyles,
    });
  } finally {
    setIsProcessing(false);
  }
};

const handleInitialize = async () => {
  if (!solanaConnected || !solanaPublicKey) {
    toast.error('Please connect your Solana wallet first', {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...toastStyles,
    });
    return;
  }

  setIsProcessing(true);
  toast.info('Initializing contract...', {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...toastStyles,
  });

  try {
    // Ensure provider is set up
    const provider = getProvider();
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    
    const program = getProgram();
    if (!program || !solanaPublicKey) {
      throw new Error('Program or wallet not initialized');
    }

    // Get the transaction record PDA
    const [transactionRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction_record")],
      program.programId
    );

    // Check if the account already exists
    const accountInfo = await connection.getAccountInfo(transactionRecord);
    if (accountInfo) {
      toast.info('Contract already initialized', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
      setIsInitialized(true);
      setIsAdmin(true);
      return;
    }

    // Use Anchor's built-in account creation
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: solanaPublicKey,
        transactionRecord: transactionRecord,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    toast.success(`Contract initialized! Hash: ${tx}`, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...toastStyles,
    });
    
    setIsInitialized(true);
    setIsAdmin(true);
  } catch (error) {
    console.error('Initialization error:', error);
    toast.error('Failed to initialize contract. Please try again.', {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...toastStyles,
    });
  } finally {
    setIsProcessing(false);
  }
};