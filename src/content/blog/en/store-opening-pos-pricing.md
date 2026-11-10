---
title: 'A Month to Open a Store — and IT Stands Behind the Construction Crew'
description: 'I handled IT for a Brooklyn supermarket chain as it grew from 3 stores to 15. We never set the schedule, and our share of the work was making sure the right price rang up at the register.'
pubDate: 'Aug 23 2026'
lang: 'en'
translation: 'store-opening-pos-pricing'
tags: ['retail', 'pos', 'field-notes']
---

> Environment: 2002–2009, a supermarket chain in Brooklyn, New York / IBM retail POS (integrator: STCR) / BRData back office / Symbol handheld terminals
>
> 10 cash registers per store as standard, 20 in the larger stores

IT preparation for each new store took roughly a month.

It would be a mistake to read that month as a measure of IT workload. It was **the time we were tied to the construction schedule**.

## We stand behind the construction crew

Store IT doesn't start in an empty space. Power has to come in, wiring has to be pulled, and the checkout lanes have to be laid out before we can put any equipment down. The construction crew gets all of that ready.

So we never set our own schedule. When construction slipped, we slipped with it; when it moved up, we had to cram. Even the one-month figure was never the same twice. It depended on the construction schedule.

Within that month, **the time IT actually spent inside the store, hands on equipment, was a little over a week**. But that week was packed. Placing equipment, connecting it, loading the data and verifying it all had to fit inside it.

So when construction slipped, our work didn't shrink. We had to do **the same amount in less time**.

If you come to store infrastructure from a software-only background, you don't have this instinct. A server arrives when you order it; a store has to be **physically built** before IT can start.

## IT is not one team

I keep writing "we," but this wasn't one person's job. IT itself was split into roles.

- **Data management** — items and prices, the BRData side. Building and reconciling the data that goes down to the store
- **Field support** — going into the store, placing and connecting equipment, and taking the problems that come up after opening

Every opening ran on both tracks at once. While the equipment went up on site, the data side prepared that store's item file. If only one of them was finished, the store couldn't open. With every register standing but prices wrong, you can't open the lanes; with perfect data but no registers, it's useless.

I was on the price management side, which is why this post leans more toward data than equipment.

## The opening date doesn't move

One more condition sits on top of all this. **The opening date has already been advertised.**

Once the flyers are out with a date on them, that date is fixed. Construction can slip, but the opening date stays where it is. Whatever slips gets pushed onto the stages that come after. The stage that came after was us.

So we worked through the night. During the day the construction crew and other teams were in the store, and there was no room to place equipment or tidy cables. We went in at night, after everyone had left.

This isn't a story about bad management. The opening date can't move because marketing has already spent the money, and construction usually slips for a reason. But **someone has to absorb that compression, and by design the last stage absorbs it.**

Twenty years later, that structure hasn't changed. I still see projects where the migration date gets set first and the preparation time shrinks. The only difference is that now it's servers instead of stores.

## Installing the POS is only the start

We ran IBM retail POS, and the actual build-out was done with an integrator called STCR. STCR handled the hardware installation. With 10 cash registers per store as standard and 20 in the larger ones, the volume alone was significant.

Still, that part of the schedule was predictable. Set a date with the vendor and it was done on that date.

What wasn't predictable came next: **verifying the BRData back-office system against our store environment**. Of all the work IT spent its own time on, that was the longest every time.

BRData wasn't just a system that pushed prices down. It also took the sales data back and built reports from it, so every new store had to line up in both directions.

## How a price travels

The structure itself is simple.

```
BRData (head office · item/price master)
        ↓  item file
Store POS
        ↓
Register scanner — applied the moment a customer's item is scanned
```

BRData sends the item file, and the POS applies it the moment an item crosses the scanner. There's no point where a person steps in. So if the file is wrong, **the wrong price rings up in front of the customer**.

Files went down at two kinds of times:

- **Weekly sale items before the weekend** — on a regular schedule
- **Vendor price adjustments** — whenever they happened

In other words, it wasn't "set it up once and you're done." It was a pipeline that kept flowing.

## What happens at the register when the file doesn't land

If the item file doesn't apply correctly, scanning an item brings up **item not found**. Then the cashier has to key it in by hand.

Once or twice, you get past it. When it keeps happening on opening day with a line at every register, it stops being an IT problem and becomes a store operations problem.

## People walk the aisles

So, separately from sending the files, people checked by hand that **the price on the shelf tag matched the price that actually rang up at the register**.

They walked the aisles with Symbol handheld terminals, comparing as they went. Each store had someone picked and trained for this job. It wasn't something you could hand to just anyone.

When mismatches turned up, we collected those items, built a batch file in BRData and sent it back down to the POS. Check → collect → resend was one loop.

Some still slipped through — the ones a customer found first. On the floor, the rule was:

- The cashier asks the front-end manager for a price check
- The reference is **the shelf tag, or the price label on the item**

The reference is the price the customer saw when they picked the item up, not what the register showed. With that rule clear, arguments at the register don't drag on.

## The day the cards go down

The biggest incidents in a store weren't item files. They were **the days credit cards stopped working**.

Most of the time the cause was the internet going down. The payment terminals weren't broken; the store was cut off from the outside.

So we connected a **dial-up modem backup** to the POS. When the internet died, approvals went over the phone line.

Naturally, it was slow. Bearable on a normal day, but at peak hours the lines backed up and the complaints poured in. Still, payments went through.

If the modem failed too, there was nothing left to do. **Cash only.**

I'm not telling this to show off a backup line. Even twenty years ago, a store's sales hung on a single internet connection, so **building a path one step down in advance** was part of the design. It's no different today.

## The data comes back

That's the way down. There was a way back up as well.

Sales records from the registers piled up in the POS. Those were **automatically imported into BRData to build reports** — on a schedule, not run by hand.

The reports covered roughly:

- Daily and weekly sales, plus **monthly, quarterly and yearly sales**
- Performance by department
- Units sold by item — what sells and what doesn't
- Margins
- How well the sale items worked

They were read by **executives, store managers and the buyers**.

The buyers are the important part. How much of each item sold is the number that decides what to bring in next, and how much. A single item scanned at a register eventually flows all the way to purchasing.

This is what matters: the same pipeline runs in both directions. There isn't one road for prices going down and a separate one for sales coming back. **The sale price I pushed down this week comes back as a number in next month's report.**

So handling item files was never simple data entry. Get it wrong, and the customer pays the wrong amount, that wrong amount piles up in the sales reports, and the next decision gets made from those reports.

## Sending it isn't the end

When a price adjustment went down from BRData, each store was notified and the price-check person verified it. Even for batches that were scheduled to run automatically, we had a separate step to **confirm the export actually happened**.

There's a reason that became a habit.

BRData and STCR cooperated with each other. Both vendors did their part properly. But that is a different question from **whether that price actually rings up at the register in our store**.

There is always a gap between the vendor saying "it's been sent" and it being applied in the store. If nobody checks that gap, customers pay the wrong price and nobody knows.

## From one store a month to two

While the chain grew from 3 stores to 15, there were times later on when **we opened two in one month**.

We didn't work twice as fast. What changed was the order: **placing vendor orders and booking schedules ahead of time, to match the construction schedule**. That's all.

At first, we moved when we saw construction nearing the end. Then ordering, waiting for delivery and booking the vendor all stacked up one after another. One store had to finish before the next could start.

Booking ahead made those waits overlap. While one store was in verification, the next already had its equipment on site.

The bottleneck wasn't how fast we worked; it was **the waiting**. Once we pulled that forward, two openings could overlap and still work.

## Closing

If you read that month as "equipment installation must take a long time," you're looking in the wrong direction. The construction crew held the schedule, and the vendor finished the hardware on its date.

Where IT really spent its time, in between, was **confirming that the data was right in the real environment**. And that doesn't get automated. It only shows up when someone walks the aisles with a handheld.

Twenty years later, looking into Active Directory or Entra ID, I feel the same thing. The installation works as documented, but **whether it behaves the way you intended in your environment only shows up when you check it yourself.** Even when the vendor documentation says "do it this way," it isn't talking about your environment.

The tools have changed. The nature of the work hasn't.
