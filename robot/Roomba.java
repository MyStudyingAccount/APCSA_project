package robot;

import kareltherobot.*;

//To make everything look beautiful, and to show how to write it in a elegant way, I have to introduce method earlier than supposed to be. And this is actually a bit different than how you normally do it as we are now trying to extend on the karel J robot module
class BetterBot extends Robot
{
	public BetterBot(int street, int avenue, Direction direction, int beepers) {
		super(street, avenue, direction, beepers);
	}
	// all the things upon here basically means (because we are more superior than
	// the robot module, and to fulfill our glorious goal of writing a neat code) we
	// are declaring a extension to the orignal Robot module called BetterBot which
	// contains everything in robot module plus all those following methods that we
	// made

	// to turn right we turn left 3 times
	public void turnRight()
	{
		turnLeft();
		turnLeft();
		turnLeft();
	}

	// what this does shall be self explanatory
	public int pickAllBeepersAndCount()
	{
		int beepersCollected = 0;
		while (nextToABeeper())
		{
			pickBeeper();
			beepersCollected++;
		}
		return beepersCollected;
		// return means it will have a value in the end, so you can plug it in your
		// program like how you plug in a interger variable, for example you can do int
		// MyVar1=pickAllBeepersAndCount();
	}

	public void/* note here its public void */ pickAllBeepers()
	{
		while (nextToABeeper())
		{
			pickBeeper();
		}
		// public void means this function is not going to return a value, so you use it
		// like how you use roomba.move() or System.out.print()
		// this one is not used currently but when you are developing on production(when
		// you get a job), you will want to do so just in case you might need it in the
		// future
	}

}

public class Roomba implements Directions
{


	// (because of the weakness and undevelopedness of the Robot module, )we are
	// changing roomba into our BetterBot
	public int cleanRoom(String worldName, int startX, int startY)
	{
		BetterBot /* Used to be Robot */ roomba = new BetterBot(startX, startY, East, 67);

		// debug settings
		int travelingPattern = 2;

		// World settings
		World.readWorld(worldName);
		World.setVisible(true);
		World.setDelay(0);

		// variables initialize
		int totalBeepers = 0;
		boolean finish = false;
		int area = 0;
		// to find the area, we can simply do it by adding 1 to our counting variable
		// each time our bot moves to a new gird, which is every move for pattern 1, and
		// all the move expect the ones moving backwards for pattern 2
		area++;
		// in this way we didnt count the area for our inital grid, so we have to add
		// area by one here

		int pileNumber = 0;
		// Explain it here
		// [WIP]
		int biggestPileNumber = 0;
		int biggestPilePositionX = 0;
		int biggestPilePositionY = 0;

		// temp variables
		int currentPileBeeperNumber = 0;
		int biggestPileRawPositionX = 0;
		int biggestPileRawPositionY = 0;
		double averagePileSize=0;
		double percentDirty=0;
		// we want the position from the top left corner, but before the program is done
		// we dont know where it is, but we have to record the position though out our
		// program, so we keep a raw data

		int SmallestRoombaPositionX = Integer.MAX_VALUE;
		int biggestRoombaPositionY = -1;
		//they are actually the position of the left up corner
		while (!finish)
		{
			// if we are not finished

			// we have 2 ways to do it now, we can either do zig zag or clear a line and go
			// back and go to the next line, like the ladder E.
			// the first way is relatively hard to write but require less work for the bot
			// the second way is realtively easier to write, but our roomba will have to do
			// extra work

			// first way
			if (travelingPattern == 1)
			{
				while (roomba.frontIsClear())
				{
					currentPileBeeperNumber = roomba.pickAllBeepersAndCount();
					if (currentPileBeeperNumber > biggestPileNumber)
					{
						biggestPileNumber = currentPileBeeperNumber;
						biggestPileRawPositionX = roomba.avenue();
						biggestPileRawPositionY = roomba.street();
					}
					if (currentPileBeeperNumber > 0)
					{
						pileNumber++;
					}
					totalBeepers = totalBeepers + currentPileBeeperNumber;
					// remember how roomba.pickAllBeepersAndCount is defined? Its gonna return the
					// number of the beeper it have collected.

					// can also write in this way
					// totalBeepers += roomba.pickAllBeepersAndCount();

					roomba.move();
					if (roomba.street() > biggestRoombaPositionY)
					{
						biggestRoombaPositionY = roomba.street();
					}
					if (roomba.avenue() < SmallestRoombaPositionX)
					{
						SmallestRoombaPositionX = roomba.avenue();
					}
					area++;
				}
				// if the program run till here it means front is not clear, else it should
				// still be looping in the while
				// in this case we can assume its running into a wall

				boolean facingEast = true;
				if (roomba.facingEast())
				{
					roomba.turnLeft();
				}
				else
				{
					roomba.turnRight();
					facingEast = false;
				}
				if (roomba.frontIsClear())
				{
					roomba.move();
					if (roomba.street() > biggestRoombaPositionY)
					{
						biggestRoombaPositionY = roomba.street();
					}
					if (roomba.avenue() < SmallestRoombaPositionX)
					{
						SmallestRoombaPositionX = roomba.avenue();
					}
					area++;
				}
				else
				{
					// another tricky but unconvensional way to get the corner position is this
					// cornerRawPositionY=roomba.street();
					finish = true;
				}

				currentPileBeeperNumber = roomba.pickAllBeepersAndCount();
				if (currentPileBeeperNumber > biggestPileNumber)
				{
					biggestPileNumber = currentPileBeeperNumber;
					biggestPileRawPositionX = roomba.avenue();
					biggestPileRawPositionY = roomba.street();
				}
				if (currentPileBeeperNumber > 0)
				{
					pileNumber++;
				}
				totalBeepers = totalBeepers + currentPileBeeperNumber;
				if (facingEast)
				{
					roomba.turnLeft();
				}
				else
				{
					roomba.turnRight();
				}
			}

			else if (travelingPattern == 2)
			{
				while (roomba.frontIsClear())
				{

					roomba.move();
					if (roomba.street() > biggestRoombaPositionY)
					{
						biggestRoombaPositionY = roomba.street();
					}
					if (roomba.avenue() < SmallestRoombaPositionX)
					{
						SmallestRoombaPositionX = roomba.avenue();
					}
					area++;

					currentPileBeeperNumber = roomba.pickAllBeepersAndCount();
					if (currentPileBeeperNumber > biggestPileNumber)
					{
						biggestPileNumber = currentPileBeeperNumber;
						biggestPileRawPositionX = roomba.avenue();
						biggestPileRawPositionY = roomba.street();
					}
					if (currentPileBeeperNumber > 0)
					{
						pileNumber++;
					}
					totalBeepers = totalBeepers + currentPileBeeperNumber; // remember how roomba.pickAllBeepersAndCount
																			// is defined? Its gonna return the
					// number of the beeper it have collected.

					// can also write in this way
					// totalBeepers += roomba.pickAllBeepersAndCount();
				}
				roomba.turnRight();
				roomba.turnRight();
				while (roomba.frontIsClear())
				{
					roomba.move();
					if (roomba.street() > biggestRoombaPositionY)
					{
						biggestRoombaPositionY = roomba.street();
					}
					if (roomba.avenue() < SmallestRoombaPositionX)
					{
						SmallestRoombaPositionX = roomba.avenue();
					}
				} // dont have to check if there's beepers as we are going the same way back
				roomba.turnRight();
				if (roomba.frontIsClear())
				{

					roomba.move();
					if (roomba.street() > biggestRoombaPositionY)
					{
						biggestRoombaPositionY = roomba.street();
					}
					if (roomba.avenue() < SmallestRoombaPositionX)
					{
						SmallestRoombaPositionX = roomba.avenue();
					}
					area++;
					currentPileBeeperNumber = roomba.pickAllBeepersAndCount();
					if (currentPileBeeperNumber > biggestPileNumber)
					{
						biggestPileNumber = currentPileBeeperNumber;
						biggestPileRawPositionX = roomba.avenue();
						biggestPileRawPositionY = roomba.street();
					}
					if (currentPileBeeperNumber > 0)
					{
						pileNumber++;
					}
					totalBeepers = totalBeepers + currentPileBeeperNumber;
					roomba.turnRight();
				}
				else
				{
					// if you are not brave enough to take the challenge those two also get you the
					// corner position, try to think about why
					// cornerRawPositionX=roomba.avenue();
					// cornerRawPositionY=roomba.street();
					finish = true;
				}
			}
		}

		// convert raw biggest pile position into the position we want
		biggestPilePositionX=biggestPileRawPositionX-SmallestRoombaPositionX;
		biggestPilePositionY=biggestRoombaPositionY-biggestPileRawPositionY;


		averagePileSize=(double)(totalBeepers)/(double)(pileNumber);
		percentDirty=(double)(pileNumber)/(double)(area);
		//output
		System.out.println("Area is " + area);
		System.out.println("Number of pile is " + pileNumber);
		System.out.println("Number of beeper is " + totalBeepers);
		System.out.println("Biggest pile have " + biggestPileNumber + " of beepers");
		System.out.println("Biggest pile from top left corner is right " + biggestPilePositionX + " and down " + biggestPilePositionY);
		System.out.println("The average pile size is " + averagePileSize);
		System.out.println("Percent dirty is " + percentDirty);
		return totalBeepers;
	}

	public static void main(String[] args)
	{
		//String worldName = "robot/TestWorld-1.wld";
		//String worldName = "robot/TestWorld-2.wld";
		//String worldName = "robot/basicRoom.wld";
		String worldName = "robot/finalTestWorld2024.wld";
		

		Roomba cleaner = new Roomba();
		//basicRoom
		//int totalBeepers = cleaner.cleanRoom(worldName, 7, 6);
		//TestWorld1
		//int totalBeepers = cleaner.cleanRoom(worldName, 25, 16);
		//TestWorld2
		//int totalBeepers = cleaner.cleanRoom(worldName, 5, 6);
		//FinalTestWorld
		int totalBeepers = cleaner.cleanRoom(worldName, 26, 101);

	}

}