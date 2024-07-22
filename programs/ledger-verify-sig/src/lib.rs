use anchor_lang::prelude::*;

declare_id!("J3VFbbhE9YBwELdnHS7Shg7QkjtZDoxaBpKFCcr6EDax");

#[program]
pub mod bond {
    use super::*;

    pub fn verify_call(_ctx: Context<VerifyCallCtx>) -> Result<()> {
        Ok(())
    }

    pub fn verify_call_with_param(
        _ctx: Context<VerifyCallWithParamCtx>,
        _msg: [u8; 32],
    ) -> Result<()> {
        Ok(())
    }

    pub fn verify_call_with_param_2(
        _ctx: Context<VerifyCallWithParam2Ctx>,
        _msg: [u8; 32],
    ) -> Result<()> {
        Ok(())
    }

    pub fn initialize_verification(
        ctx: Context<InitializeVerificationCtx>,
        _seed: [u8; 32],
    ) -> Result<()> {
        ctx.accounts.verification.owner = ctx.accounts.signer.key();
        msg!("Signer: {:}", &ctx.accounts.signer.key());
        Ok(())
    }

    pub fn bond(ctx: Context<BondCtx>, message: [u8; 32], signature: [u8; 65]) -> Result<()> {
        ctx.accounts.bond.message = message;
        ctx.accounts.bond.signature = signature;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct VerifyCallCtx<'info> {
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct VerifyCallWithParamCtx<'info> {
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct VerifyCallWithParam2Ctx {}

#[derive(Accounts)]
#[instruction(_seed: [u8;32])]
pub struct InitializeVerificationCtx<'info> {
    #[account(
        init,
        seeds = [b"verification", signer.key().as_ref(), &_seed[..]],
        bump,
        payer = signer,
        space = 8 + 32 + 1,
    )]
    pub verification: Account<'info, Verification>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(seed: u8)]
pub struct BondCtx<'info> {
    #[account(
        init,
        seeds = [b"bond", signer.key().as_ref()],
        bump,
        payer = signer,
        space = 8 + 20 + 32 + 65,
    )]
    pub bond: Account<'info, Bond>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Verification {
    owner: Pubkey,
}

#[account]
pub struct Bond {
    message: [u8; 32],
    signature: [u8; 65],
}
